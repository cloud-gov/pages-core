import { useState, useCallback, useEffect } from 'react';

// interface FileUploadItem {
//   data: File;
//   id: string;
//   status: 'pending' | 'queued' | 'uploading' | 'success' | 'error';
//   message?: string
// }

// interface UseMultiFileUploadOptions {
//   maxConcurrentUploads?: number;
//   onUpload: (file: File) => Promise<any>;
// }

export const useMultiFileUpload = ({ maxConcurrentUploads = 2, onUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState([]);

  // eslint-disable-next-line sonarjs/pseudo-random
  const generateFileId = () => Math.random().toString(36).substring(2, 15);

  const addFiles = useCallback((newFiles) => {
    const fileItems = newFiles.map((data) => ({
      data,
      id: generateFileId(),
      status: 'queued',
      message: null,
    }));

    setFiles((prevFiles) => [...prevFiles, ...fileItems]);
  }, []);

  const clearFiles = useCallback(() => setFiles(() => []));

  const uploadFile = useCallback(
    async (fileItem) => {
      try {
        // Update the uploading status of the files
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === fileItem.id ? { ...f, status: 'uploading' } : f,
          ),
        );

        // Perform the upload
        await onUpload(fileItem.data);

        // Update state on success
        // Remove successful upload
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === fileItem.id ? { ...f, status: 'success', message: 'Success.' } : f,
          ),
        );
      } catch (error) {
        // Update state on error
        const message = error?.message || `Unable to upload ${fileItem.name}`;

        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === fileItem.id ? { ...f, status: 'error', message } : f,
          ),
        );
      }
    },
    [onUpload],
  );

  const startUploads = useCallback(async () => {
    setIsUploading(() => true);
  }, [files]);

  useEffect(() => {
    // Manage concurrent uploads
    function run() {
      if (isUploading) {
        const pendingFiles = files.filter((f) => f.status === 'queued');

        if (pendingFiles.length === 0) {
          return setIsUploading(() => false);
        }

        const filesToUpload = pendingFiles.slice(0, maxConcurrentUploads);

        return Promise.allSettled(
          filesToUpload.map((fileItem) => {
            return uploadFile(fileItem);
          }),
        );
      }
    }

    run();
  }, [files, isUploading, maxConcurrentUploads, uploadFile]);

  const removeFile = useCallback((fileId) => {
    setFiles((prevFiles) => prevFiles.filter((f) => f.id !== fileId));
  }, []);

  return {
    files,
    addFiles,
    clearFiles,
    isUploading,
    removeFile,
    startUploads,
  };
};
