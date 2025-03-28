import React from 'react';
import PropTypes from 'prop-types';
import { IconAttachment } from '@shared/icons';
import { dateAndTimeSimple } from '@util/datetime';
import prettyBytes from 'pretty-bytes';

const FileDetails = ({
  name,
  fullPath,
  lastModifiedBy,
  lastModifiedAt,
  size,
  mimeType,
  onDelete,
}) => {
  return (
    <div className="file-details">
      <div className="file-details__header bg-base-lightest">
        <IconAttachment className="usa-icon margin-right-1" />
        <h3>File details</h3>
      </div>
      <table className="usa-table usa-table--borderless file-details__table">
        <thead className="usa-sr-only">
          <tr>
            <th scope="col">Property</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">File name</th>
            <td className="font-mono-xs text-ls-neg-1 text-bold">{name}</td>
          </tr>
          <tr>
            <th scope="row">Full path</th>
            <td className="font-mono-xs text-ls-neg-1">
              <a
                style={{ wordBreak: 'break-all' }}
                href={fullPath}
                target="_blank"
                rel="noopener noreferrer"
              >
                {fullPath}
              </a>
            </td>
          </tr>
          <tr>
            <th scope="row">Last modified by</th>
            <td className="text-bold">{lastModifiedBy}</td>
          </tr>
          <tr>
            <th scope="row">Last modified at</th>
            <td>{dateAndTimeSimple(lastModifiedAt)}</td>
          </tr>
          <tr>
            <th scope="row">File size</th>
            <td>{size && prettyBytes(size)}</td>
          </tr>
          <tr>
            <th scope="row">MIME type</th>
            <td>{mimeType}</td>
          </tr>
          <tr>
            <th scope="row">Actions</th>
            <td>
              <a href={fullPath} download className="usa-button">
                Download
              </a>
              <button
                type="button"
                title="Remove from public storage"
                className="usa-button usa-button--outline delete-button"
                onClick={() => onDelete()}
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

FileDetails.propTypes = {
  name: PropTypes.string.isRequired,
  id: PropTypes.number.isRequired,
  fullPath: PropTypes.string.isRequired,
  lastModifiedBy: PropTypes.string.isRequired,
  lastModifiedAt: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  mimeType: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default FileDetails;
