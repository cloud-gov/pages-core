const multer = require('multer');

// eslint-disable-next-line sonarjs/content-length
const multipartForm = multer({ limits: { fileSize: 200000000, files: 1 } });

module.exports = multipartForm;
