/* eslint no-console: 0, sonarjs/x-powered-by: 0, sonarjs/content-length: 0 */
const express = require('express');
const multer = require('multer');

const app = express();
const port = 8081;

const multipartForm = multer({ limits: { fileSize: 200000000, files: 1 } });

// POST /upload route with multer
app.post('/v0/file-storage/123/upload', multipartForm.any(), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const [file] = req.files;
    const { name, parent } = req.body;

    if (!name || !parent) {
      return res.status(400).json({ error: 'File name and parent are required' });
    }

    if (file) {
      const { buffer: fileBuffer, originalname, encoding, mimetype, size } = file;
      console.log('File Buffer length:', fileBuffer ? fileBuffer.length : 'undefined');
      console.log('Originalname:', originalname);
      console.log('Encoding:', encoding);
      console.log('Mimetype:', mimetype);
      console.log('Size:', size);
    }

    res.status(200).json({
      message: 'File uploaded successfully',
      cfForwardedUrl: req.headers['x-cf-forwarded-url'],
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`Test server running on http://localhost:${port}`);
});

module.exports = app;
