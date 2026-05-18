const multer = require('multer');

// eslint-disable-next-line sonarjs/content-length
const multipartForm = multer({ limits: { fileSize: 250000000, files: 1 } });

module.exports = multipartForm;
