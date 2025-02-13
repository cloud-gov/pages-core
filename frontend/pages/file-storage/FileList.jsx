import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { dateAndTimeSimple, timeFrom } from '@util/datetime';
import { IconAttachment, IconFolder, IconLink } from '@shared/icons';

// constants and functions used by both components

function ariaFormatSort(direction) {
  if (direction === 'asc') return 'ascending';
  if (direction === 'desc') return 'descending';
  return null;
}
const SORT_KEY_NAME = 'name';
const SORT_KEY_LAST_MODIFIED = 'lastModified';

const FileListRow = ({
  item,
  path,
  currentSortKey,
  onNavigate,
  onDelete,
  onViewDetails,
}) => {
  // handle copying the file's URL
  const [copySuccess, setCopySuccess] = useState(false);
  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 4000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <tr key={item.name}>
      <td
        className="file-name-cell"
        data-label="Name"
        data-sort-active={currentSortKey === SORT_KEY_NAME ? true : undefined}
      >
        <div className="file-name-wrap">
          <span className="file-icon">
            {item.type === 'folder' ? (
              <IconFolder className="usa-icon" />
            ) : (
              <IconAttachment className="usa-icon" />
            )}
          </span>
          {item.type === 'folder' ? (
            <a
              href="#"
              title="Open folder"
              className="usa-link file-name"
              onClick={(e) => {
                e.preventDefault();
                onNavigate(`${path.replace(/\/$/, '')}/${item.name}`);
              }}
            >
              {item.name}
            </a>
          ) : (
            <a
              href="#"
              title="View file details"
              className="usa-link file-name"
              onClick={(e) => {
                e.preventDefault();
                onViewDetails(item.name);
              }}
            >
              {item.name}
            </a>
          )}
        </div>
      </td>

      <td
        data-label="Uploaded"
        data-sort-active={currentSortKey === SORT_KEY_LAST_MODIFIED ? true : undefined}
      >
        <span title={dateAndTimeSimple(item.lastModified)}>
          {item.lastModified ? timeFrom(item.lastModified) : 'N/A'}
        </span>
      </td>
      <td data-label="Actions" className="text-right">
        {item.type === 'file' && (
          <button
            type="button"
            title="Copy full url to clipboard"
            className="usa-button usa-button--unstyled margin-right-2 text-bold"
            onClick={() => handleCopy(`${item.url}`)}
          >
            {copySuccess ? 'Copied!' : 'Copy link'}
            <IconLink className="usa-icon" />
          </button>
        )}
        <button
          type="button"
          title="Remove from public storage"
          className="usa-button usa-button--outline delete-button"
          onClick={() => onDelete(item)}
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

const FileList = ({
  path,
  data,
  onDelete,
  onNavigate,
  onSort,
  onViewDetails,
  currentSortKey,
  currentSortOrder,
}) => {
  const EMPTY_STATE_MESSAGE = 'No files or folders found.';
  const TABLE_CAPTION = `
    Listing all contents for the current folder, sorted by ${currentSortKey} in 
    ${ariaFormatSort(currentSortOrder)} order
  `; // TODO: Create and update an aria live region to announce all changes

  return (
    <table
      className="usa-table usa-table--borderless usa-table--sortable width-full"
      data-sortable
    >
      <caption className="usa-sr-only">{TABLE_CAPTION}</caption>
      <thead>
        <tr>
          <th
            scope="col"
            data-is-sortable
            role="columnheader"
            aria-sort={
              currentSortKey === SORT_KEY_NAME
                ? ariaFormatSort(currentSortOrder)
                : undefined
            }
          >
            Name
            <button
              type="button"
              className="usa-button usa-button--unstyled usa-table__sort-button"
              tabIndex="0"
              onClick={() => onSort(SORT_KEY_NAME)}
              aria-label="Sort by name"
            >
              <SortIcon
                sort={currentSortKey === SORT_KEY_NAME ? currentSortOrder : undefined}
              />
            </button>
          </th>
          <th
            scope="col"
            className="width-last-mod"
            data-is-sortable
            role="columnheader"
            aria-sort={
              currentSortKey === SORT_KEY_LAST_MODIFIED
                ? ariaFormatSort(currentSortOrder)
                : undefined
            }
          >
            Uploaded
            <button
              type="button"
              className="usa-button usa-button--unstyled usa-table__sort-button"
              tabIndex="0"
              onClick={() => onSort(SORT_KEY_LAST_MODIFIED)}
              aria-label="Sort by last modified"
            >
              <SortIcon
                sort={
                  currentSortKey === SORT_KEY_LAST_MODIFIED ? currentSortOrder : undefined
                }
              />
            </button>
          </th>
          <th scope="col" className="width-actions">
            <span className="usa-sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <FileListRow
            key={item.name}
            item={item}
            path={path}
            currentSortKey={currentSortKey}
            onNavigate={onNavigate}
            onDelete={onDelete}
            onViewDetails={onViewDetails}
          />
        ))}
        {data.length === 0 && (
          <tr>
            <td colSpan="99" className="text-italic">
              {EMPTY_STATE_MESSAGE}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

const SortIcon = ({ sort = false }) => (
  <svg className="usa-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    {sort === 'desc' && (
      <g className="descending" fill="currentColor">
        <path d="M17 17L15.59 15.59L12.9999 18.17V2H10.9999V18.17L8.41 15.58L7 17L11.9999 22L17 17Z"></path>
      </g>
    )}
    {sort === 'asc' && (
      <g className="ascending" fill="currentColor">
        <path
          transform="rotate(180, 12, 12)"
          d="M17 17L15.59 15.59L12.9999 18.17V2H10.9999V18.17L8.41 15.58L7 17L11.9999 22L17 17Z"
        ></path>
      </g>
    )}
    {!sort && (
      <g className="unsorted" fill="currentColor">
        <polygon points="15.17 15 13 17.17 13 6.83 15.17 9 16.58 7.59 12 3 7.41 7.59 8.83 9 11 6.83 11 17.17 8.83 15 7.42 16.41 12 21 16.59 16.41 15.17 15"></polygon>
      </g>
    )}
  </svg>
);

FileList.propTypes = {
  path: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['file', 'folder']).isRequired,
      lastModified: PropTypes.string.isRequired,
      url: PropTypes.string,
    }),
  ).isRequired,
  onDelete: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onSort: PropTypes.func.isRequired,
  currentSortKey: PropTypes.string.isRequired,
  currentSortOrder: PropTypes.oneOf(['asc', 'desc']).isRequired,
};

FileListRow.propTypes = {
  path: PropTypes.string.isRequired,
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['file', 'folder']).isRequired,
    lastModified: PropTypes.string.isRequired,
    url: PropTypes.string,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  currentSortKey: PropTypes.string.isRequired,
};

SortIcon.propTypes = {
  sort: PropTypes.string,
};

export default FileList;
