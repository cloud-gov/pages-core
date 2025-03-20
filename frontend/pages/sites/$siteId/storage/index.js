import React, { useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useFileStorage from '@hooks/useFileStorage';

import AlertBanner from '@shared/alertBanner';
import LocationBar from './LocationBar';
import FileDetails from './FileDetails';
import NewFileOrFolder from './NewFileOrFolder';
import FileList from './FileList';
import Pagination from '@shared/Pagination';
import QueryPage from '@shared/layouts/QueryPage';
import Dialog from '@shared/Dialog';
import { currentSite } from '@selectors/site';

function FileStoragePage() {
  const { id } = useParams();
  const site = useSelector((state) => currentSite(state.sites, id));
  const fileStorageServiceId = site.fileStorageServiceId;
  const [searchParams, setSearchParams] = useSearchParams();
  let path = decodeURIComponent(searchParams.get('path') || '/').replace(/^\/+/, '/');
  // Ensure path always ends in "/" because we use it for asset url links
  if (path !== '/') {
    // eslint-disable-next-line sonarjs/slow-regex
    path = path.replace(/\/+$/, '') + '/';
  }
  const DEFAULT_SORT_KEY = 'updatedAt';
  const DEFAULT_SORT_ORDER = 'desc';
  const REVERSE_SORT_ORDER = 'asc';

  const sortKey = searchParams.get('sortKey') || DEFAULT_SORT_KEY;
  const sortOrder = searchParams.get('sortOrder') || DEFAULT_SORT_ORDER;
  const initalPage = parseInt(searchParams.get('page')) || 1;
  const {
    data: fetchedPublicFiles,
    currentPage,
    totalPages,
    totalItems,
    isLoading,
    defaultError,
    deleteItem,
    deleteError,
    deleteSuccess,
    uploadFile,
    createFolder,
    createFolderError,
    createFolderSuccess,
  } = useFileStorage(fileStorageServiceId, path, sortKey, sortOrder, initalPage);

  const [highlightItem, setHighlightItem] = useState(null);
  const [savedScrollPos, setSavedScrollPos] = useState(0);
  const queryFileDetails = searchParams.get('details');
  const storageRoot = `${site.siteOrigin}/~assets`;
  const foundFileDetails = fetchedPublicFiles?.find(
    (file) => file.name === queryFileDetails,
  );
  const scrollTo = useRef(null);
  function scrollToTop() {
    return scrollTo.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const handleNavigate = (newPath) => {
    const decodedPath = decodeURIComponent(newPath);
    // Remove trailing slash if it exists
    // eslint-disable-next-line sonarjs/slow-regex
    let normalizedPath = `${decodedPath.replace(/\/+$/, '')}`;

    if (normalizedPath !== '/') {
      normalizedPath += '/'; // Ensure folders always end with "/"
    }
    searchParams.delete('details');
    searchParams.delete('page');

    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('path', normalizedPath);
      return newParams;
    });
    scrollToTop();
  };

  const INITIAL_DIALOG_PROPS = {
    open: false,
    primaryHandler: () => {},
  };
  const resetModal = useCallback(() => {
    setDialogProps(INITIAL_DIALOG_PROPS);
  }, []);

  const [dialogProps, setDialogProps] = useState({
    closeHandler: resetModal,
    primaryHandler: () => {},
  });

  const handlePageChange = (newPage) => {
    if (newPage === currentPage) return;
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', newPage);
      return newParams;
    });
    scrollToTop();
  };

  const handleViewDetails = (file) => {
    setHighlightItem(file);
    setSavedScrollPos(window.pageYOffset);
    setSearchParams({
      ...Object.fromEntries(searchParams),
      details: file,
    });

    // scroll all the way up, this view is short
    window.scrollTo({ top: 0 });
  };

  const handleCloseDetails = () => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete('details');
      return newParams;
    });
    // scroll back to where you were in this really long list
    setTimeout(() => {
      window.scrollTo({ top: savedScrollPos, behavior: 'smooth' });
    }, 100);
  };

  const handleSort = (sortKey) => {
    const currentSortKey = searchParams.get('sortKey') || DEFAULT_SORT_KEY;
    const currentSortOrder = searchParams.get('sortOrder') || DEFAULT_SORT_ORDER;

    let newSortOrder;
    if (currentSortKey === sortKey) {
      // Toggle the sort order if the same column is clicked
      newSortOrder =
        currentSortOrder === DEFAULT_SORT_ORDER ? REVERSE_SORT_ORDER : DEFAULT_SORT_ORDER;
    } else {
      // Alpha sort is better done in ASC, not DESC
      newSortOrder = REVERSE_SORT_ORDER;
    }
    setSearchParams({
      ...Object.fromEntries(searchParams),
      sortKey,
      sortOrder: newSortOrder,
      page: 1,
    });
  };

  const handleDelete = useCallback(
    async (item) => {
      const isFolder = item.type === 'directory';
      const confirmMessage = isFolder
        ? // eslint-disable-next-line sonarjs/slow-regex
          `Are you sure you want to delete the folder  "${item.name.replace(/\/+$/, '')}"?
         Please check that it does not contain any files.`
        : `Are you sure you want to delete the file "${item.name}"?`;
      const deleteHandler = async () => {
        await deleteItem(item);
        resetModal();
      };
      setDialogProps({
        ...dialogProps,
        open: true,
        header: 'Are you sure?',
        message: confirmMessage,
        primaryButton: 'Yes, I want to delete',
        primaryHandler: deleteHandler,
        secondaryButton: 'Cancel',
        secondaryHandler: resetModal,
        closeHandler: resetModal,
      });
    },
    [deleteItem, resetModal],
  );

  const handleCreateFolder = async (folderName) => {
    await createFolder(path, folderName);
  };

  return (
    <QueryPage
      data={fetchedPublicFiles}
      showErrorIfEmpty={false}
      error={defaultError}
      isPending={false}
      isPlaceholderData={false}
    >
      {deleteError && (
        <AlertBanner status="error" header="Delete Error" message={deleteError} />
      )}

      {deleteSuccess && (
        <AlertBanner
          status="success"
          header="Delete Successful"
          message={deleteSuccess}
        />
      )}

      {createFolderError && (
        <AlertBanner
          status="error"
          header="Folder Creation Error"
          message={createFolderError}
        />
      )}

      {createFolderSuccess && (
        <AlertBanner
          status="success"
          header="Folder Created"
          message={createFolderSuccess}
        />
      )}
      <Dialog {...dialogProps} />
      <div className="grid-col-12" ref={scrollTo}>
        <LocationBar
          path={path}
          siteId={id}
          storageRoot={storageRoot}
          onNavigate={handleNavigate}
        />
        <NewFileOrFolder
          onUpload={(file) => uploadFile(path, file)}
          onCreateFolder={handleCreateFolder}
        />
        {foundFileDetails && foundFileDetails.id && (
          <FileDetails
            name={foundFileDetails?.name || ''}
            id={foundFileDetails?.id}
            fullPath={`${storageRoot}${path}${foundFileDetails?.name}`}
            updatedBy={foundFileDetails?.updatedBy || ''}
            updatedAt={foundFileDetails?.updatedAt || ''}
            size={foundFileDetails?.metadata.size || 0}
            mimeType={foundFileDetails?.type || ''}
            onDelete={handleDelete}
            onClose={handleCloseDetails}
          />
        )}
        {(!queryFileDetails || !foundFileDetails) && (
          <>
            {queryFileDetails && !foundFileDetails && (
              <AlertBanner
                status="error margin-bottom-2"
                header="File not found"
                message={`Could not find details for the file named
                  "${encodeURI(queryFileDetails)}" in this folder.
                  Check the location or URL and try again.`}
              />
            )}
            <FileList
              path={path}
              baseUrl={site.siteOrigin}
              data={fetchedPublicFiles || []}
              onDelete={handleDelete}
              onNavigate={handleNavigate}
              onSort={handleSort}
              onViewDetails={handleViewDetails}
              currentSortKey={sortKey}
              currentSortOrder={sortOrder}
              highlightItem={highlightItem}
            >
              {!isLoading && fetchedPublicFiles?.length === 0 && (
                <tr>
                  <td colSpan="99" className="text-italic">
                    No files or folders found.
                  </td>
                </tr>
              )}
            </FileList>
            <Pagination
              currentPage={currentPage || 0}
              totalPages={totalPages || 0}
              totalItems={totalItems || 0}
              itemsOnCurrentPage={fetchedPublicFiles?.length || 0}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </QueryPage>
  );
}

export { FileStoragePage };
export default FileStoragePage;
