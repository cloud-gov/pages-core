import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { dateAndTimeSimple, timeFrom } from '@util/datetime';
import { IconAttachment, IconFolder, IconLink } from '@shared/icons';

// constants and functions used by both components

function ariaFormatSort(direction) {
  if (direction === 'asc') return 'ascending';
  if (direction === 'desc') return 'descending';
}
const SORT_KEY_NAME = 'name';
const SORT_KEY_LAST_MODIFIED = 'updatedAt';

const FileListRow = ({
  item,
  baseUrl,
  path,
  currentSortKey,
  onNavigate,
  onDelete,
  onViewDetails,
  highlight = false,
}) => {
  const copyUrl = `${baseUrl}/${item.key}`;
  // handle copying the file's URL
  const [copySuccess, setCopySuccess] = useState(false);
  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 4000);
    } catch (err) {
      throw new Error('Failed to Copy', err);
    }
  };

  return (
    <tr key={item.name} id={item.name} className={highlight ? 'highlight' : ''}>
      <td
        className="file-name-cell"
        data-label="Name"
        data-sort-active={currentSortKey === SORT_KEY_NAME ? true : undefined}
      >
        <div className="file-name-wrap  font-mono-xs text-ls-neg-1">
          <span className="file-icon">
            {item.type === 'directory' ? (
              <IconFolder className="usa-icon" />
            ) : (
              <IconAttachment className="usa-icon" />
            )}
          </span>
          {item.type === 'directory' ? (
            // eslint-disable-next-line jsx-a11y/anchor-is-valid
            <a
              href="#"
              title="Open folder"
              className="usa-link file-name"
              onClick={(e) => {
                e.preventDefault();
                // eslint-disable-next-line sonarjs/slow-regex
                onNavigate(`${path.replace(/\/+$/, '')}/${item.name}/`);
              }}
            >
              {item.name}
            </a>
          ) : (
            // eslint-disable-next-line jsx-a11y/anchor-is-valid
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
        data-label="Last Modified"
        data-sort-active={currentSortKey === SORT_KEY_LAST_MODIFIED ? true : undefined}
      >
        <span title={dateAndTimeSimple(item.updatedAt)}>
          {item.updatedAt ? timeFrom(item.updatedAt) : 'N/A'}
        </span>
      </td>
      <td data-label="Actions" className="text-right">
        {item.type !== 'directory' && (
          <button
            type="button"
            title="Copy full url to clipboard"
            className="usa-button usa-button--unstyled margin-right-2 text-bold"
            onClick={() => handleCopy(`${copyUrl}`)}
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
  baseUrl,
  data,
  onDelete,
  onNavigate,
  onSort,
  onViewDetails,
  currentSortKey,
  currentSortOrder,
  highlightItem,
  children,
}) => {
  const TABLE_CAPTION = `
    Listing all contents for the current folder, sorted by ${currentSortKey} in
    ${ariaFormatSort(currentSortOrder)} order
  `; // TODO: Create and update an aria live region to announce all changes

  return (
    <table
      className="
        usa-table usa-table--borderless usa-table--sortable width-full margin-y-0
      "
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
                sort={currentSortKey === SORT_KEY_NAME ? currentSortOrder : null}
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
            Last Modified
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
          <th scope="col" className="width-actions height-6">
            <span className="usa-sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {children}
        {data.map((item) => (
          <FileListRow
            key={item.key}
            item={item}
            path={path}
            baseUrl={baseUrl}
            currentSortKey={currentSortKey}
            onNavigate={onNavigate}
            onDelete={onDelete}
            onViewDetails={onViewDetails}
            highlight={highlightItem === item.name}
          />
        ))}
      </tbody>
    </table>
  );
};

const SortIcon = ({ sort = '' }) => (
  <svg className="usa-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    {sort === 'desc' && (
      <g className="descending" fill="currentColor" aria-label="descending sort icon">
        {/* eslint-disable max-len */}
        <path d="M17 17L15.59 15.59L12.9999 18.17V2H10.9999V18.17L8.41 15.58L7 17L11.9999 22L17 17Z"></path>
      </g>
    )}
    {sort === 'asc' && (
      <g className="ascending" fill="currentColor" aria-label="ascending sort icon">
        <path
          transform="rotate(180, 12, 12)"
          d="M17 17L15.59 15.59L12.9999 18.17V2H10.9999V18.17L8.41 15.58L7 17L11.9999 22L17 17Z"
        ></path>
      </g>
    )}
    {sort !== 'asc' && sort !== 'desc' && (
      <g className="unsorted" fill="currentColor" aria-label="unsorted icon">
        <polygon points="15.17 15 13 17.17 13 6.83 15.17 9 16.58 7.59 12 3 7.41 7.59 8.83 9 11 6.83 11 17.17 8.83 15 7.42 16.41 12 21 16.59 16.41 15.17 15"></polygon>
        {/* eslint-enable max-len */}
      </g>
    )}
  </svg>
);

FileList.propTypes = {
  path: PropTypes.string.isRequired,
  baseUrl: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      updatedAt: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onDelete: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onSort: PropTypes.func.isRequired,
  currentSortKey: PropTypes.string.isRequired,
  currentSortOrder: PropTypes.oneOf(['asc', 'desc']).isRequired,
  highlightItem: PropTypes.string,
  children: PropTypes.node,
};

FileListRow.propTypes = {
  path: PropTypes.string.isRequired,
  baseUrl: PropTypes.string.isRequired,
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  currentSortKey: PropTypes.string.isRequired,
  highlight: PropTypes.bool,
};

SortIcon.propTypes = {
  sort: PropTypes.string,
};

export default FileList;
