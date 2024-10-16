import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';

import publishedBranchActions from '@actions/publishedBranchActions';
import { currentSite } from '@selectors/site';
import LoadingIndicator from '@shared/LoadingIndicator';
import BranchViewLink from '@shared/branchViewLink';
import AlertBanner from '@shared/alertBanner';

import globals from '../../globals';

function renderBranchFilesLink(branch) {
  const href = `/sites/${branch.site.id}/published/${branch.name}`;
  return <Link to={href}>View files</Link>;
}

function renderPublishedBranchRow(branch, site) {
  return (
    <tr key={branch.name}>
      <td>{branch.name}</td>
      <td>
        <ul className="usa-list--unstyled">
          <li>
            <BranchViewLink branchName={branch.name} site={site} />
          </li>
          <li>
            {renderBranchFilesLink(branch)}
          </li>
        </ul>
      </td>
    </tr>
  );
}

function renderPublishedBranchesTable(data, site) {
  return (
    <div>
      <p>
        Use this page to see every version of your site&apos;s code published on
        {` ${globals.APP_NAME} `}
        and to audit the specific files that
        {` ${globals.APP_NAME} `}
        has published.
      </p>
      <table className="usa-table usa-table--borderless usa-table--stacked published-branch-table log-table width-full table-full-width">
        <thead>
          <tr>
            <th>Branch</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          { data.map(d => renderPublishedBranchRow(d, site)) }
        </tbody>
      </table>
    </div>
  );
}

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
  return renderPublishedBranchesTable(publishedBranches.data, site);
}

export { PublishedBranchesTable };
export default PublishedBranchesTable;
