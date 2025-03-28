import React, { useState } from 'react';
import PropTypes from 'prop-types';
import FileUpload from '@shared/FileUpload';
import { IconFolder, IconAttachment } from '@shared/icons';
import AlertBanner from '@shared/alertBanner';
import { Link } from 'react-router-dom';
const NewFileOrFolder = ({ onUpload, onCreateFolder }) => {
  const [folderName, setFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showFolderNameField, setShowFolderNameField] = useState(false);
  const [showFileDropZone, setShowFileDropZone] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateFolder = async () => {
    const trimmedName = folderName.trim();

    if (trimmedName.length < 1) {
      return;
    }

    setCreatingFolder(true);
    setErrorMessage('');

    try {
      await onCreateFolder(trimmedName);
      setFolderName('');
      setShowFolderNameField(false);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to create folder.');
    }

    setCreatingFolder(false);
  };
  const docsLink = 'https://cloud.gov/pages/documentation'; // TODO: update link
  const message = (
    <>
      Before uploading, carefully review your file to ensure it does not contain any
      Personally Identifiable Information (PII) or sensitive data. We{' '}
      <Link to="./storage/logs"> log every file upload and deletion </Link> for security
      tracking. For more about Public File Storage, review the{' '}
      <a target="_blank" rel="noreferrer" className="usa-link" href={docsLink}>
        documentation
      </a>
      .
    </>
  );
  return (
    <div className="new-file-or-folder">
      {errorMessage && <div className="usa-error-message">{errorMessage}</div>}
      {showFileDropZone && (
        <>
          <AlertBanner
            className="margin-top-1"
            status="warning"
            message={message}
            alertRole={false}
          />
          <FileUpload
            onUpload={onUpload}
            onCancel={() => setShowFileDropZone(false)}
            triggerOnMount
          />
        </>
      )}
      {showFolderNameField && (
        <div className="new-folder grid-row flex-align-center margin-y-1">
          <input
            type="text"
            placeholder="Enter folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            disabled={creatingFolder}
            className="usa-input grid-col flex-fill margin-top-0"
          />

          <button
            type="button"
            className="usa-button grid-col flex-auto margin-left-1"
            onClick={handleCreateFolder}
            disabled={creatingFolder || folderName.trim().length < 1}
          >
            Create folder
          </button>
          <button
            type="button"
            className="usa-button usa-button--outline grid-col flex-auto"
            onClick={() => setShowFolderNameField(false)}
          >
            Cancel
          </button>
        </div>
      )}
      <div className="margin-y-1">
        {!showFolderNameField && !showFileDropZone && (
          <>
            <button
              type="button"
              className="usa-button"
              onClick={() => setShowFileDropZone(true)}
            >
              <IconAttachment className="usa-icon" />
              Upload files
            </button>
            <button
              type="button"
              className="usa-button usa-button--outline"
              onClick={() => setShowFolderNameField(true)}
            >
              <IconFolder className="usa-icon" />
              New folder
            </button>
            <Link
              className="usa-button usa-button--unstyled text-top padding-105"
              to="./logs"
            >
              View file history logs
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default NewFileOrFolder;

NewFileOrFolder.propTypes = {
  onUpload: PropTypes.func.isRequired,
  onCreateFolder: PropTypes.func.isRequired,
};
