const multer = require('multer');
const { logger } = require('../../winston');

const multipartForm = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      logger.info('multer writing to /tmp');
      cb(null, '/tmp');
    },
  }),
  // eslint-disable-next-line sonarjs/content-length
  limits: { fileSize: 300000000, files: 1 },
});

logger.info('multipart form');

module.exports = multipartForm;
