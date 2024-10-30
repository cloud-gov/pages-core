/* eslint-disable no-console */
const Http = require('http');

const { HOST = 'localhost', PORT = 8989 } = process.env;

const dateFormat = new Intl.DateTimeFormat('en', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

const server = Http.createServer(async (req, res) => {
  res.writeHead(200);
  res.end();

  const buffers = [];

  for await (const chunk of req) {
    buffers.push(chunk);
  }

  const data = Buffer.concat(buffers).toString();
  const { headers, method, url } = req;
  const { pathname, searchParams } = new URL(url, `http://${headers.host}`);

  console.log(`
    ${dateFormat.format(new Date())}
    ${method.toUpperCase()} ${pathname}
      headers: ${JSON.stringify(headers)}
      search: ${searchParams}
      body: ${data}
  `);
});

server.listen(PORT, HOST, () => {
  console.log(`Echo server listening on ${HOST}:${PORT}`);
});
