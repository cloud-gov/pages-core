/* eslint no-console: 0 */
const http = require('node:http');
const https = require('node:https');
const url = require('node:url');
const { Readable } = require('node:stream');
const Busboy = require('@fastify/busboy');
const axios = require('axios');

const DEFAULT_PORT = 8080;
const CF_FORWARDED_URL = 'X-Cf-Forwarded-Url';
const SCAN_BASEURL = process.env.SCAN_BASEURL;
const SCAN_PATH = '/v2/scan';
const SCAN_ENDPOINT = `http://${SCAN_BASEURL}:${DEFAULT_PORT}${SCAN_PATH}`;

function getForwardedURL(req) {
  try {
    const forwardedURL = req.headers[CF_FORWARDED_URL.toLowerCase()];
    return new url.URL(forwardedURL);
  } catch {
    return null;
  }
}

function getPort() {
  return process.env.PORT || DEFAULT_PORT.toString();
}

function shouldScan(req) {
  const regex = /^\/v0\/file-storage\/[^/]+\/upload$/;
  const forwardedURL = getForwardedURL(req);

  return (
    req.method === 'POST' &&
    forwardedURL?.pathname?.length < 100 &&
    regex.test(forwardedURL?.pathname)
  );
}

function skipSslValidation() {
  const value = process.env.SKIP_SSL_VALIDATION;
  if (value === undefined) return true;
  return value.toLowerCase() === 'true';
}

function passThroughProxy(req, res) {
  const forwardedURL = getForwardedURL(req);

  if (!forwardedURL) {
    res.writeHead(400);
    return res.end('No forwarded URL provided');
  }

  // Proxy request
  const proxyReq = (forwardedURL.protocol === 'https:' ? https : http).request(
    {
      hostname: forwardedURL.hostname,
      port: forwardedURL.port || (forwardedURL.protocol === 'https:' ? 443 : 80),
      path: forwardedURL.pathname + forwardedURL.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: forwardedURL.host,
      },
      rejectUnauthorized: !skipSslValidation(),
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', (error) => {
    console.error('Proxy error:', error);
    res.writeHead(500);
    res.end('Proxy error');
  });

  req.pipe(proxyReq);
}

async function parseReqFormData(req, data) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const formData = new FormData();
    const bufferStream = new Readable({
      read(_) {
        this.push(data);
        this.push(null); // Signal the end of the stream
      },
    });

    busboy.on('file', async (fieldName, file, filename, encoding, mimetype) => {
      const chunks = [];

      file.on('data', (data) => {
        chunks.push(data);
      });

      file.on('end', () => {
        formData.append(fieldName, new Blob([Buffer.concat(chunks)]), {
          filename: filename,
          contentType: mimetype,
          encoding,
        });
      });

      file.on('error', (error) => {
        reject(error);
      });
    });

    busboy.on('finish', () => {
      resolve(formData);
    });

    busboy.on('error', (error) => {
      reject(error);
    });

    bufferStream.pipe(busboy);
  });
}

function scanThenProxy(req, res) {
  const forwardedURL = getForwardedURL(req);
  const chunks = [];

  if (!forwardedURL) {
    res.writeHead(400);
    return res.end('No forwarded URL provided');
  }

  req.on('error', (error) => {
    console.error('Request error: ', error.message);
    res.writeHead(500);
    res.end('Request error');
  });

  req.on('data', (chunk) => {
    chunks.push(chunk);
  });

  req.on('end', async () => {
    try {
      const fileData = Buffer.concat(chunks);
      const formData = await parseReqFormData(req, fileData);

      await axios.post(SCAN_ENDPOINT, formData, {
        headers: {
          ...req.headers,
        },
      });

      return postScanProxy(req, res, forwardedURL, fileData);
    } catch (error) {
      let errorMessage;

      if (error?.status === 406) {
        errorMessage = `Error: File has been flagged as malicious`;
      } else {
        errorMessage = `Error: ${error.message}`;
      }

      res.writeHead(error.status || 500);
      res.end(errorMessage);
    }
  });
}

function postScanProxy(req, res, forwardedURL, fileData) {
  const proxyReq = (forwardedURL.protocol === 'https:' ? https : http).request(
    {
      hostname: forwardedURL.hostname,
      port: forwardedURL.port || (forwardedURL.protocol === 'https:' ? 443 : 80),
      path: forwardedURL.pathname + forwardedURL.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: forwardedURL.host,
      },
      rejectUnauthorized: !skipSslValidation(),
    },
    (proxyRes) => {
      console.log('PROXY CALLBACK IN SEND PROXY REQUEST');
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', (error) => {
    console.error('Proxy error:', error.message);
    res.writeHead(500);
    res.end('Proxy error');
  });

  proxyReq.on('response', (proxyRes) => {
    console.log('PROXY RESPONSE:', proxyRes.statusCode);
  });

  proxyReq.write(fileData);
  proxyReq.end();
}

function main() {
  if (!SCAN_BASEURL) {
    console.error('Env variable SCAN_BASEURL is not defined.');
    process.exit(1);
  }

  const server = http.createServer(async (req, res) => {
    if (shouldScan(req)) {
      return scanThenProxy(req, res);
    } else {
      return passThroughProxy(req, res);
    }
  });

  const port = getPort();

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

main();
