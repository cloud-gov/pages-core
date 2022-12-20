import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from '@reach/router';

import publishedBranchActions from '../../actions/publishedBranchActions';
import { currentSite } from '../../selectors/site';
import LoadingIndicator from '../LoadingIndicator';
import BranchViewLink from '../branchViewLink';
import globals from '../../globals';
import AlertBanner from '../alertBanner';

function renderBranchFilesLink(branch) {
  const href = `/sites/${branch.site.id}/published/${branch.name}`;
  return <Link to={href}>View files</Link>;
}

function renderPublishedBranchRow(branch, site) {
  return (
    <tr key={branch.name}>
      <td>{branch.name}</td>
      <td>
        <ul className="usa-unstyled-list">
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
        { site.id }
        Use this page to see every version of your site&apos;s code published on
        {` ${globals.APP_NAME} `}
        and to audit the specific files that
        {` ${globals.APP_NAME} `}
        has published.
      </p>
      <table className="usa-table-borderless published-branch-table log-table table-full-width">
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

function SitePublishedBranchesTable() {
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

export { SitePublishedBranchesTable };
export default SitePublishedBranchesTable;
