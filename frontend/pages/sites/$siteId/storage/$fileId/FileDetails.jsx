import React, { useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { currentSite } from '@selectors/site';
import QueryPage from '@shared/layouts/QueryPage';

import useFileStorageDetails from '@hooks/useFileStorageDetails';
import PropTypes from 'prop-types';
import { IconAttachment, IconFolder } from '@shared/icons';
import { dateAndTimeSimple } from '@util/datetime';
import prettyBytes from 'pretty-bytes';
let onDelete, onClose;

function FileDetails() {
  const { id, fileId } = useParams();
  const site = useSelector((state) => currentSite(state.sites, id));
  const fileStorageServiceId = site.fileStorageServiceId;
  const storageRoot = `${site.siteOrigin}/~assets`;
  const [searchParams, setSearchParams] = useSearchParams();

  let path = decodeURIComponent(searchParams.get('path') || '/').replace(/^\/+/, '/');
  // Ensure path always ends in "/" because we use it for asset url links
  if (path !== '/') {
    // eslint-disable-next-line sonarjs/slow-regex
    path = path.replace(/\/+$/, '') + '/';
  }

  const {
    data,
    data: {
      name,
      key,
      // description,
      lastModifiedBy,
      lastModifiedAt,
      type: mimeType,
      metadata,
    },
    isLoading,
    isPending,
    isPlaceholderData,
    error,
    deleteItem,
    deleteError,
    deleteSuccess,
  } = useFileStorageDetails(fileStorageServiceId, fileId);

  let fullPath = `${path}${key}`;
  let filesize = metadata?.size;
  let cleanedName = mimeType === 'directory' ? name.replace(/\/$/, '') : name;

  // TODO: hande "closing" and going back to history? what if this is first visit?
  // const handleCloseDetails = () => {
  //   setSearchParams((prev) => {
  //     const newParams = new URLSearchParams(prev);
  //     newParams.delete('details');
  //     return newParams;
  //   });
  //   // scroll back to where you were in this really long list
  //   setTimeout(() => {
  //     window.scrollTo({ top: savedScrollPos, behavior: 'smooth' });
  //   }, 100);
  // };

  //TODO: Is this ok for Folders too?

  const MISSING_DATA = 'No data available';

  if (fileId < 1) return null;
  return (
    <QueryPage
      data={[data]}
      showErrorIfEmpty={false}
      error={error}
      isPending={isPending}
      isPlaceholderData={isPlaceholderData}
    >
      <div className="file-details">
        <div className="file-details__header bg-base-lightest">
          {mimeType === 'directory' && (
            <>
              <IconFolder className="usa-icon margin-right-1" />
              <h3>Folder details</h3>
            </>
          )}
          {mimeType !== 'directory' && (
            <>
              <IconAttachment className="usa-icon margin-right-1" />
              <h3>File details</h3>
            </>
          )}
          <button
            title="close file details"
            className="usa-button usa-button--unstyled file-details__close"
            onClick={onClose}
          >
            <svg className="usa-icon" aria-hidden="true" role="img">
              <use href="/img/sprite.svg#close"></use>
            </svg>
          </button>
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
              <th scope="row">{mimeType === 'directory' ? 'Folder' : 'File'} name</th>
              <td className="font-mono-xs text-ls-neg-1 text-bold">
                {cleanedName || MISSING_DATA}
              </td>
            </tr>
            <tr>
              <th scope="row">Full path</th>
              <td className="font-mono-xs text-ls-neg-1">
                {(fullPath && (
                  <a
                    style={{ wordBreak: 'break-all' }}
                    href={fullPath}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {fullPath}
                  </a>
                )) ||
                  MISSING_DATA}
              </td>
            </tr>
            <tr>
              <th scope="row">Uploaded by</th>
              <td className="text-bold">{lastModifiedBy || MISSING_DATA}</td>
            </tr>
            <tr>
              <th scope="row">Uploaded at</th>
              <td>
                {(lastModifiedAt && dateAndTimeSimple(lastModifiedAt)) || MISSING_DATA}
              </td>
            </tr>
            {mimeType !== 'directory' && (
              <>
                <tr>
                  <th scope="row">File size</th>
                  <td>{(filesize && prettyBytes(filesize)) || MISSING_DATA}</td>
                </tr>
                <tr>
                  <th scope="row">MIME type</th>
                  <td>{mimeType || MISSING_DATA}</td>
                </tr>
              </>
            )}
            <tr>
              <th scope="row">Actions</th>
              <td>
                {(fullPath && (
                  <>
                    {mimeType !== 'directory' && (
                      <a href={fullPath} download className="usa-button">
                        Download
                      </a>
                    )}
                    <button
                      type="button"
                      title="Remove from public storage"
                      className="usa-button usa-button--outline delete-button"
                      onClick={() => {
                        onDelete({ id: fileId, name: name });
                        onClose();
                      }}
                    >
                      Delete
                    </button>
                  </>
                )) ||
                  MISSING_DATA}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </QueryPage>
  );
}

// FileDetails.propTypes = {
//   name: PropTypes.string.isRequired,
//   id: PropTypes.number.isRequired,
//   fullPath: PropTypes.string.isRequired,
//   updatedBy: PropTypes.string.isRequired,
//   updatedAt: PropTypes.string.isRequired,
//   size: PropTypes.number.isRequired,
//   mimeType: PropTypes.string.isRequired,
//   onDelete: PropTypes.func.isRequired,
//   onClose: PropTypes.func.isRequired,
// };

export { FileDetails };
export default FileDetails;
