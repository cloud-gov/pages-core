import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AlertBanner from '@shared/alertBanner';
import LocationBar from '../file-storage/LocationBar';
import FileList from '../file-storage/FileList';
import LoadingIndicator from '@shared/LoadingIndicator';

import { currentSite } from '@selectors/site';



function FileStoragePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useParams();
  const path = searchParams.get('path') || '';
  const site = useSelector((state) => currentSite(state.sites, id));

  // Mocked API state for now
  const publicFilesActions = { isLoading: false, error: null };
  const mockFiles = [
    {
      name: "Documents",
      type: "folder",
      lastModified: "2025-02-12T22:30:00Z",
      url: null
    },
    {
      name: "report.pdf",
      type: "file",
      lastModified: "2025-01-09T15:45:00Z",
      url: `${site.viewLink}~assets/report.pdf`
    },
    {
      name: "super-dooper-way-too-long-file-name-must-truncate-presentation.pptx",
      type: "file",
      lastModified: "2024-02-08T09:15:00Z",
      url: `${site.viewLink}~assets/presentation.pptx`
    }
  ];

  const mockPagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: mockFiles.length
  };

  const DEFAULT_SORT_KEY = "name";
  const DEFAULT_SORT_ORDER = "asc";
  const REVERSE_SORT_ORDER = "desc";

  const sortKey = searchParams.get('sortKey') || DEFAULT_SORT_KEY;
  const sortOrder = searchParams.get('sortOrder') || DEFAULT_SORT_ORDER;

  const fetchedPublicFiles = {
    ...mockPagination,
    sortKey,
    sortOrder,
    data: mockFiles
  };


  const handleNavigate = (newPath) => {
    const normalizedPath = newPath.replace(/^\/+|\/+$/g, "");
    searchParams.delete('details');
    setSearchParams({
      ...Object.fromEntries(searchParams),
      path: normalizedPath,
    });
  };

  const handleViewDetails = (file) => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      details: file
    });
  };


  const handleDelete = (item) => {
    if (item.type === 'folder') {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete the folder "${item.name}"? All files inside must be deleted first.`,
      );
      if (!confirmDelete) return;
    } else {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete the file "${item.name}"?`,
      );
      if (!confirmDelete) return;
    }

    console.log("Deleting:", item); // Replace this with actual delete logic when API is ready
  };


  const handleSort = (sortKey) => {
    const currentSortKey = searchParams.get('sortKey') || DEFAULT_SORT_KEY;
    const currentSortOrder = searchParams.get('sortOrder') || DEFAULT_SORT_ORDER;

    const isSameKey = currentSortKey === sortKey;
    const newSortOrder = isSameKey && currentSortOrder === DEFAULT_SORT_ORDER ? REVERSE_SORT_ORDER : DEFAULT_SORT_ORDER;

    setSearchParams({
      ...Object.fromEntries(searchParams),
      sortKey,
      sortOrder: newSortOrder
    });
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
      <FileList
        path={path}
        data={fetchedPublicFiles.data}
        onDelete={handleDelete}
        onNavigate={handleNavigate}
        onSort={handleSort}
        onViewDetails={handleViewDetails}
        currentSortKey={fetchedPublicFiles.sortKey}
        currentSortOrder={fetchedPublicFiles.sortOrder}
      />
    </div>
  );
}

export { FileStoragePage };
export default FileStoragePage;
