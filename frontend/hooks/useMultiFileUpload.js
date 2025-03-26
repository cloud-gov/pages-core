import { useState, useCallback } from 'react';

// interface FileUploadItem {
//   data: File;
//   id: string;
//   status: | 'queued' | 'uploading' | 'success' | 'error';
//   message?: string
// }

// interface UseMultiFileUploadOptions {
//   maxFileSizeMB?: number;
//   onUpload: (file: File) => Promise<any>;
// }

const MEGABYTE_LIMIT = 100;
const mbToBytes = (mb) => mb * 1024 * 1024;

export const useMultiFileUpload = ({ onUpload, maxFileSizeMB = MEGABYTE_LIMIT }) => {
  const [isUploading, setIsUploading] = useState('pending');
  const [files, setFiles] = useState([]);

  // eslint-disable-next-line sonarjs/pseudo-random
  const generateFileId = () => Math.random().toString(36).substring(2, 15);

  const addFiles = useCallback((newFiles) => {
    const fileItems = Array.from(newFiles).map((data) => {
      const byteLimit = mbToBytes(maxFileSizeMB);

      if (data.size > byteLimit) {
        return {
          data,
          id: generateFileId(),
          status: 'error',
          message: `Exceeds the ${maxFileSizeMB}MB limit.`,
        };
      }

      return {
        data,
        id: generateFileId(),
        status: 'queued',
        message: null,
      };
    });

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
        const message = error?.message || `Unable to upload ${fileItem.data.name}`;

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
    setIsUploading(() => 'uploading');
    const pendingFiles = files.filter((f) => f.status === 'queued');

    if (pendingFiles.length === 0) {
      return setIsUploading(() => 'complete');
    }

    await Promise.allSettled(pendingFiles.map((fileItem) => uploadFile(fileItem)));

    setIsUploading(() => 'complete');
  }, [files]);

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
