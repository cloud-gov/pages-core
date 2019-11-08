const scanUploadStartedType = 'SCAN_UPLOAD_STARTED';
const scanUploadedType = 'SCAN_UPLOADED';

const scanUploadStarted = () => ({
  type: scanUploadStartedType,
});

const scanUploaded = () => ({
  type: scanUploadedType,
});

export { scanUploadStarted, scanUploaded };
