import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import { useMultiFileUpload } from '@hooks/useMultiFileUpload';

const MEGABYTE_LIMIT = 250;
const MAX_FILE_SIZE = MEGABYTE_LIMIT * 1024 * 1024; // 250MB

const getFileStatusColor = (status) => {
  if (status === 'error') return 'bg-secondary-lighter';

  if (status === 'success') return 'bg-mint';

  if (['queued', 'uploading'].includes(status)) return 'bg-base-lighter';

  return 'bg-primary-lightest';
};

const FileUpload = ({ onUpload, onCancel = () => {}, triggerOnMount = false }) => {
  const [fileUploadErrorMessage, setFileUploadErrorMessage] = useState('');
  const { addFiles, clearFiles, files, removeFile, startUploads } = useMultiFileUpload({
    onUpload,
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelection = (selectedFiles) => {
    const validFiles = Array.from(selectedFiles).filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        setFileUploadErrorMessage(
          `"${file.name}" exceeds the ${MEGABYTE_LIMIT}MB limit.`,
        );
        return false;
      }
      setFileUploadErrorMessage('');
      return true;
    });

    addFiles(validFiles);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelection(event.dataTransfer.files);
  };

  useEffect(() => {
    if (triggerOnMount && fileInputRef.current) {
      // make sure the ref has rendered
      requestAnimationFrame(() => {
        // it should be the same but just in case
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      });
    }
  }, [triggerOnMount]);

  return (
    <div
      data-testid="drag"
      className={`maxw-full usa-file-input ${isDragging ? 'usa-file-input--drag' : ''}`}
    >
      {fileUploadErrorMessage && (
        <div
          id="file-input-error"
          className="usa-error-message margin-top-1"
          aria-live="polite"
        >
          {fileUploadErrorMessage}
        </div>
      )}

      <div
        id="file-input-dropzone"
        className="usa-file-input__target margin-bottom-1px"
        role="button"
        tabIndex="0"
        aria-label="File uploader"
        aria-describedby="file-input-error file-input-status"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={(e) => {
          if (e.detail === 0) return;
          fileInputRef.current?.click();
        }}
        onKeyUp={(e) => {
          if (!e.key) return;
          if (!e.repeat && (e.code === 'Space' || e.code === 'Enter')) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <div className="usa-file-input__box bg-primary-lightest" aria-hidden="true"></div>

        {files.length === 0 && (
          <div id="file-input-instructions" className="usa-file-input__instructions">
            <span className="usa-file-input__drag-text font-body-xs">
              Drag files here or
            </span>{' '}
            <span
              className="usa-button usa-button--unstyled usa-file-input__choose"
              role="presentation"
            >
              choose from your computer
            </span>
          </div>
        )}
        {files.length > 0 && (
          <div className="usa-file-input__preview-heading" id="file-input-status">
            {`${files.length} file${files.length > 1 ? 's' : ''} selected`}
            <button
              type="button"
              className="usa-file-input__choose usa-button--unstyled"
              onClick={(e) => {
                e.preventDefault();
                fileInputRef.current?.click();
              }}
            >
              Change files
            </button>
          </div>
        )}
        <label htmlFor="file-input" className="usa-sr-only">
          Upload files
        </label>
        <input
          tabIndex={-1}
          ref={fileInputRef}
          id="file-input"
          className="usa-sr-only"
          type="file"
          multiple
          onChange={(e) => handleFileSelection(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <>
          {files.map((file) => {
            const bgColor = getFileStatusColor(file.status);

            return (
              <div
                key={file.id}
                className={
                  'grid-gap-sm ' +
                  'usa-file-input__preview padding-y-1 font-mono-sm ' +
                  bgColor
                }
              >
                <button
                  disabled={file.status === 'uploading'}
                  type="button"
                  className="usa-button usa-button--unstyled file-input__remove"
                  onClick={() => removeFile(file.id)}
                  title={`Remove ${file.data.name}`}
                >
                  <svg
                    className="usa-icon width-3 height-3 margin-1"
                    aria-hidden="true"
                    focusable="false"
                    role="img"
                  >
                    {file.status !== 'uploading' ? (
                      <use xlinkHref="/img/sprite.svg#close" />
                    ) : (
                      <use xlinkHref="/img/sprite.svg#arrow_upward" />
                    )}
                  </svg>{' '}
                </button>
                <span>{file.data.name}</span>
                {file.message && (
                  <span className="margin-x-1 text-bold">{file.message}</span>
                )}
                <span className="font-body-sm margin-left-auto margin-right-1">
                  {prettyBytes(file.data.size)}
                </span>
              </div>
            );
          })}
        </>
      )}

      <div className="usa-button-group margin-0 padding-1 bg-primary-lighter">
        <button
          type="button"
          disabled={files.length < 1}
          className="usa-button"
          onClick={() => startUploads()}
        >
          Upload
        </button>
        <button
          type="button"
          className="usa-button usa-button--outline"
          onClick={() => {
            clearFiles();
            onCancel();
          }}
        >
          Cancel upload
        </button>
      </div>
    </div>
  );
};

FileUpload.propTypes = {
  onUpload: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  triggerOnMount: PropTypes.bool,
};

export default FileUpload;
