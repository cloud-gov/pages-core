const router = require('express').Router();
const FileStorageServiceController = require('../controllers/file-storage-service');
const { csrfProtection, multipartForm, sessionAuth } = require('../middlewares');

router.use(sessionAuth);
router.use(csrfProtection);

router.get(
  '/file-storage/:file_storage_id/',
  FileStorageServiceController.listDirectoryFiles,
);
router.get(
  '/file-storage/:file_storage_id/file/:file_id',
  FileStorageServiceController.getFile,
);
router.delete(
  '/file-storage/:file_storage_id/file/:file_id',
  FileStorageServiceController.deleteFile,
);
router.get(
  '/file-storage/:file_storage_id/user-actions',
  FileStorageServiceController.listUserActions,
);
router.get(
  '/file-storage/:file_storage_id/user-actions/:file_id',
  FileStorageServiceController.listUserActions,
);
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
