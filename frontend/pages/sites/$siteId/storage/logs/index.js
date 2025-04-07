import React, { useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useFileStorageLogs from '@hooks/useFileStorageLogs';
import PropTypes from 'prop-types';
import QueryPage from '@shared/layouts/QueryPage';
import Pagination from '@shared/Pagination';
import AlertBanner from '@shared/alertBanner';

import { dateAndTimeSimple, timeFrom } from '@util/datetime';
import { currentSite } from '@selectors/site';

function FileStorageLogs() {
  const { id } = useParams();
  const site = useSelector((state) => currentSite(state.sites, id));
  const fileStorageServiceId = site.fileStorageServiceId;
  const [searchParams, setSearchParams] = useSearchParams();
  const initalPage = parseInt(searchParams.get('page')) || 1;

  if (!fileStorageServiceId) {
    const errorMessage = (
      <span>
        This site does not have Public File Storage enabled. Please contact{' '}
        <a
          title="Email support to launch a custom domain."
          href="mailto:pages-support@cloud.gov"
        >
          pages-support@cloud.gov
        </a>{' '}
        to request access.
      </span>
    );
    return <AlertBanner status="info" header="" message={errorMessage} />;
  }

  const { data, isPending, error, currentPage, totalPages, totalItems } =
    useFileStorageLogs(fileStorageServiceId, initalPage);
  const scrollTo = useRef(null);
  function scrollToTop() {
    return scrollTo.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const handlePageChange = (newPage) => {
    if (newPage === currentPage) return;
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', newPage);
      return newParams;
    });
    scrollToTop();
  };

  return (
    <QueryPage
      data={data}
      showErrorIfEmpty={true}
      error={error}
      errorMessage={error?.message}
      isPending={isPending}
      isPlaceholderData={false}
    >
      <div id="top" ref={scrollTo} tabIndex="-1" />
      <LogList logs={data} />
      <Pagination
        currentPage={currentPage || 0}
        totalPages={totalPages || 0}
        totalItems={totalItems || 0}
        itemsOnCurrentPage={data?.length || 0}
        onPageChange={handlePageChange}
      />
    </QueryPage>
  );
}
// see backend for possible messages in /api/models/file-storage-user-action.js
function parseAction(action) {
  switch (action) {
    case 'UPLOAD_FILE':
      return `uploaded`;
    case 'CREATE_DIRECTORY':
      return `created`;
    case 'DELETE_FILE':
      return `deleted`;
    case 'RENAME_FILE':
      return `renamed`;
    case 'CREATE_ORGANIZATION_FILE_STORAGE_SERVICE':
    case 'CREATE_SITE_FILE_STORAGE_SERVICE':
      return `initialized file storage service`;
    default:
      return action;
  }
}

const LogList = ({ logs = [] }) => {
  const TABLE_CAPTION = `
    Listing all file history
    `;

  return (
    <table
      className="
        usa-table usa-table--borderless width-full margin-y-0 file-storage-logs
      "
    >
      <caption className="usa-sr-only">{TABLE_CAPTION}</caption>
      <thead>
        <tr>
          <th scope="col" role="columnheader">
            Action
          </th>
          <th scope="col" className="width-card" role="columnheader">
            Timestamp
          </th>
        </tr>
      </thead>
      <tbody>
        {logs?.map(({ id, fileKey, method, description, email, createdAt }) => (
          <tr key={`${id}_${method}`}>
            <td className="file-name-cell" data-label="Action">
              <span className="text-bold">{email}</span> {parseAction(description)}{' '}
              <span title={`/${fileKey}`} className="font-mono-xs text-ls-neg-1">
                /{fileKey}
              </span>
            </td>

            <td data-label="Timestamp">
              <span title={dateAndTimeSimple(createdAt)}>{timeFrom(createdAt)}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

LogList.propTypes = {
  logs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      method: PropTypes.string,
      fileKey: PropTypes.string,
      createdAt: PropTypes.string,
      email: PropTypes.string,
    }),
  ),
};

export { FileStorageLogs };
export default FileStorageLogs;
