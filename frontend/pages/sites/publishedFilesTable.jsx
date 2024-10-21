import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import publishedFileActions from '@actions/publishedFileActions';
import LoadingIndicator from '@shared/LoadingIndicator';
import AlertBanner from '@shared/alertBanner';

import PagingButtons from './components/PagingButtons';
import FilesTable from './components/FilesTable';

function PublishedFilesTable() {
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

  if (publishedFiles.isLoading) {
    return <LoadingIndicator />;
  }

  if (!publishedFiles.data || !publishedFiles.data.files.length) {
    return (
      <AlertBanner
        status="info"
        message="No published branch files available."
      />
    );
  }

  return (
    <FilesTable
      files={publishedFiles.data.files}
      name={name}
    >
      <PagingButtons
        currentPage={currentPage}
        lastPage={lastPage}
        setCurrentPage={setCurrentPage}
      />
    </FilesTable>
  );
}

export { PublishedFilesTable };
export default PublishedFilesTable;
