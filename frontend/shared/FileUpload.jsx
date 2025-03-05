import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import { IconX } from './icons';

const MEGABYTE_LIMIT = 250;
const MAX_FILE_SIZE = MEGABYTE_LIMIT * 1024 * 1024; // 250MB

const FileUpload = ({ onUpload, onCancel = null, triggerOnMount = false }) => {
  const [files, setFiles] = useState([]);
  const [fileUploadErrorMessage, setFileUploadErrorMessage] = useState('');
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
      return true;
    });

    setFiles(validFiles);
    setFileUploadErrorMessage('');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelection(event.dataTransfer.files);
  };

  const removeFile = (fileName) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
  };

  useEffect(() => {
    if (triggerOnMount && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [triggerOnMount]);

  return (
    <div
      className={`maxw-full usa-file-input ${isDragging ? 'usa-file-input--drag' : ''}`}
    >
      {fileUploadErrorMessage && (
        <div id="file-input-error" className="usa-error-message" aria-live="polite">
          {fileUploadErrorMessage}
        </div>
      )}

      <div
        id="file-input-dropzone"
        className="usa-file-input__target margin-bottom-1px"
        role="button"
        tabIndex="0"
        aria-labelledby="file-input-label file-input-instructions"
        aria-describedby="file-input-error file-input-status"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
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
            <button
              type="button"
              className="usa-button usa-button--unstyled usa-file-input__choose"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              choose from your computer
            </button>
          </div>
        )}
        {files.length > 0 && (
          <div className="usa-file-input__preview-heading" id="file-input-status">
            {`${files.length} file${files.length > 1 ? 's' : ''} selected`}
            <button
              type="button"
              className="usa-file-input__choose usa-button--unstyled"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Change files
            </button>
          </div>
        )}

        <input
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
          {files.map((file) => (
            <div
              className="
                usa-file-input__preview padding-y-1 font-mono-sm bg-primary-lightest
              "
              aria-hidden
              key={file.name}
            >
              <button
                type="button"
                className="usa-button usa-button--unstyled file-input__remove"
                onClick={() => removeFile(file.name)}
                title={`Remove ${file.name}`}
              >
                <svg
                  className="usa-icon width-3 height-3 margin-1"
                  aria-hidden="true"
                  focusable="false"
                  role="img"
                >
                  <use xlinkHref="/img/sprite.svg#close" />
                </svg>{' '}
              </button>
              <span>{file.name}</span>
              <span className="font-body-sm margin-left-auto margin-right-1">
                {prettyBytes(file.size)}
              </span>
            </div>
          ))}
        </>
      )}

      <div className="usa-button-group margin-0 padding-1 bg-primary-lighter">
        <button
          type="button"
          disabled={files.length < 1}
          className="usa-button"
          onClick={() => onUpload(files)}
        >
          Upload
        </button>
        <button
          type="button"
          className="usa-button usa-button--outline"
          onClick={() => {
            setFiles([]);
            if (onCancel) onCancel();
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
