import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import publishedBranchActions from '@actions/publishedBranchActions';
import { currentSite } from '@selectors/site';
import LoadingIndicator from '@shared/LoadingIndicator';
import AlertBanner from '@shared/alertBanner';

import BranchesTable from './components/BranchesTable';

function PublishedBranchesTable() {
  const { id } = useParams();
  const site = useSelector(state => currentSite(state.sites, id));
  const publishedBranches = useSelector(state => state.publishedBranches);

  useEffect(() => {
    publishedBranchActions.fetchPublishedBranches({ id });
  }, []);

  if (publishedBranches.isLoading) {
    return <LoadingIndicator />;
  }

  if (!publishedBranches.data.length) {
    return (
      <AlertBanner
        status="info"
        header="No branches have been published."
        message="Please wait for build to complete or check logs for error message."
      />
    );
  }
  return <BranchesTable branches={publishedBranches.data} site={site} />;
}

export { PublishedBranchesTable };
export default PublishedBranchesTable;
