const router = require('express').Router();
const FileStorageServiceController = require('../controllers/file-storage-service');
const { csrfProtection, multipartForm, sessionAuth } = require('../middlewares');

router.use(sessionAuth);
router.use(csrfProtection);

router.post(
  '/file-storage/:file_storage_id/directory',
  FileStorageServiceController.createDirectory,
);
router.post(
  '/file-storage/:file_storage_id/upload',
  multipartForm.any(),
  FileStorageServiceController.uploadFile,
);

module.exports = router;
