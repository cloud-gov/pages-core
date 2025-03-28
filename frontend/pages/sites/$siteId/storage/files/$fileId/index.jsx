import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useFileStorageFile from '@hooks/useFileStorageFile';

import FileDetails from './FileDetails';
import LocationBar from '../../LocationBar';
import AlertBanner from '@shared/alertBanner';
import QueryPage from '@shared/layouts/QueryPage';
import Dialog from '@shared/Dialog';
import { currentSite } from '@selectors/site';
import { buildFolderLink } from './utils';

const getFileUrl = (domain, key) => `${domain}/${key}`;

function FileStorageFilePage() {
  const { id, fileId: fildIdString } = useParams();
  const navigate = useNavigate();
  const fileId = parseInt(fildIdString, 10);
  const site = useSelector((state) => currentSite(state.sites, id));
  const fileStorageServiceId = site.fileStorageServiceId;

  const {
    data,
    deleteIsPending,
    deleteError,
    error,
    isPending,
    isPlaceholderData,
    deleteItem,
  } = useFileStorageFile(fileStorageServiceId, fileId);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <QueryPage
      data={data}
      error={error}
      isPending={isPending || deleteIsPending}
      isPlaceholderData={isPlaceholderData}
    >
      <Dialog
        open={isOpen}
        message={`Are you sure you want to delete the file "${data?.name}"?`}
        primaryButton="Yes, I want to delete"
        secondaryButton="Cancel"
        closeHandler={() => setIsOpen(false)}
        primaryHandler={() => {
          setIsOpen(() => false);
          const { folderUrl } = buildFolderLink(data.key, id);
          deleteItem(folderUrl);
        }}
        secondaryHandler={() => setIsOpen(false)}
      />
      {data && (
        <>
          {deleteError && (
            <AlertBanner status="error" header={'Error'} message={deleteError?.message} />
          )}
          <div className="grid-col-12">
            <LocationBar
              path={buildFolderLink(data.key, id).filePath}
              storageRoot={`${site.liveDomain}/~assets`}
              siteId={id}
              onNavigate={(path) => navigate(`/sites/${id}/storage?path=${path}`)}
              trailingSlash={false}
            />
            <FileDetails
              name={data.name}
              id={data.id}
              fullPath={getFileUrl(site.liveDomain, data.key)}
              lastModifiedAt={data.lastModifiedAt}
              lastModifiedBy={data.lastModifiedBy}
              size={data.metadata?.size}
              mimeType={data.type}
              onDelete={() => setIsOpen(true)}
            />
          </div>
        </>
      )}
    </QueryPage>
  );
}

export { FileStorageFilePage };
export default FileStorageFilePage;
