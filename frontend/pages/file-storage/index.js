import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AlertBanner from '@shared/alertBanner';
import LocationBar from '../file-storage/LocationBar';
import LoadingIndicator from '@shared/LoadingIndicator';

import { currentSite } from '@selectors/site';

function FileStoragePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useParams();
  const path = searchParams.get('path') || '';
  const site = useSelector((state) => currentSite(state.sites, id));

  // Mocked API state for now
  const publicFilesActions = { isLoading: false, error: null };
  const fetchedPublicFiles = { data: [] };

  const handleNavigate = (newPath) => {
    setSearchParams({ path: newPath });
  };

  if (publicFilesActions.isLoading) {
    return <LoadingIndicator />;
  }

  if (publicFilesActions.error) {
    return (
      <AlertBanner
        status="error"
        header="Failed to access public file storage"
        message="We could not return the public file storage for this site. Please contact Pages support for more information."
      />
    );
  }

  return (
    <div className="grid-col-12">
      <LocationBar
        path={path}
        siteId={id}
        domain={site.viewLink}
        onNavigate={handleNavigate}
      />
      {/* File table and other child components go here, using fetchedPublicFiles.data */}
    </div>
  );
}

export { FileStoragePage };
export default FileStoragePage;
