import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import publishedFileActions from '../../actions/publishedFileActions';
import globals from '../../globals';
import LoadingIndicator from '../LoadingIndicator';
import AlertBanner from '../alertBanner';

function renderPagingButtons(currentPage, lastPage, setCurrentPage) {
  const shouldDisableNextPage = currentPage === lastPage;
  const shouldDisablePreviousPage = currentPage === 0;
  const shouldShowButtons = !(lastPage !== null && lastPage === 0);

  function previousPage() {
    setCurrentPage(currentPage - 1);
  }

  function nextPage() {
    setCurrentPage(currentPage + 1);
  }

  const prevButtonClass = `${shouldDisablePreviousPage ? 'usa-button-disabled' : 'usa-button'}`;
  const nextButtonClass = `pull-right ${shouldDisableNextPage ? 'usa-button-disabled' : 'usa-button'}`;

  if (!shouldShowButtons) {
    return null;
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className={prevButtonClass}
        disabled={shouldDisablePreviousPage}
        onClick={previousPage}
        title="View the previous page of published files"
        type="button"
      >
        &laquo; Previous
      </button>

      <button
        className={nextButtonClass}
        disabled={shouldDisableNextPage}
        onClick={nextPage}
        title="View the next page of published files"
        type="button"
      >
        Next &raquo;
      </button>
    </nav>
  );
}

function renderBranchFileRow(file) {
  let viewFileLink;
  const branch = file.publishedBranch.name;
  switch (branch) {
    case file.publishedBranch.site.defaultBranch:
      viewFileLink = `${file.publishedBranch.site.viewLink}${file.name}`;
      break;
    case file.publishedBranch.site.demoBranch:
      viewFileLink = `${file.publishedBranch.site.demoViewLink}${file.name}`;
      break;
    default:
      viewFileLink = `${file.publishedBranch.site.previewLink}${branch}/${file.name}`;
  }
  return (
    <tr key={viewFileLink}>
      <td>{file.name}</td>
      <td><a href={viewFileLink} target="_blank" rel="noopener noreferrer">View</a></td>
    </tr>
  );
}

function renderPublishedFilesTable(files, name, currentPage, lastPage, setCurrentPage) {
  return (
    <div>
      <h3>{name}</h3>
      <p>
        Use this page to audit the files that
        {` ${globals.APP_NAME} `}
        has publicly published.
        Up to 200 files are shown per page.
      </p>
      <table className="usa-table-borderless table-full-width log-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          { files.filter(f => !!f.name).map(renderBranchFileRow) }
        </tbody>
      </table>
      { renderPagingButtons(currentPage, lastPage, setCurrentPage) }
    </div>
  );
}

function SitePublishedFilesTable() {
  const { id, name } = useParams();
  const publishedFiles = useSelector(state => state.publishedFiles);

  const [currentPage, setCurrentPage] = useState(0);
  const [lastPage, setLastPage] = useState(null);
  // startAtKeys is an object whose keys are page numbers, and whose values are the key of the final
  // file in the previous page used to fetch that page
  const [startAtKeys, setStartAtKeys] = useState({ 0: null });

  useEffect(() => {
    const startAtKey = startAtKeys[currentPage];
    publishedFileActions.fetchPublishedFiles(id, name, startAtKey);
  }, [currentPage]);

  useEffect(() => {
    if (!publishedFiles.data) {
      return;
    }
    // either our data wasn't truncated or we need to store the last key for future data fetching
    if (!publishedFiles.data.isTruncated) {
      setLastPage(currentPage);
    } else {
      const newKey = publishedFiles.data.files[publishedFiles.data.files.length - 1].key;
      setStartAtKeys({ ...startAtKeys, [currentPage]: newKey });
    }
  }, [publishedFiles]);

  if (publishedFiles.isLoading || !publishedFiles.data) {
    return <LoadingIndicator />;
  }

  if (!publishedFiles.data.files.length) {
    return (
      <AlertBanner
        status="info"
        message="No published branch files available."
      />
    );
  }
  return renderPublishedFilesTable(
    publishedFiles.data.files,
    name, currentPage, lastPage,
    setCurrentPage
  );
}

export { SitePublishedFilesTable };
export default SitePublishedFilesTable;
