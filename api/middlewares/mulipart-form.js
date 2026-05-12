const multer = require('multer');

const multipartForm = multer({
  storage: multer.diskStorage({ destination: '/tmp' }),
  // eslint-disable-next-line sonarjs/content-length
  limits: { fileSize: 300000000, files: 1 },
});

module.exports = multipartForm;
