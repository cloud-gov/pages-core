import React from 'react';
import LoadingIndicator from '../loadingIndicator';

const SiteGithubBranchesTable = ({ site, branches }) => {
  if (branches.isLoading) {
    return renderLoadingState()
  } else if (branches.error || !branches.data || branches.data.length === 0) {
    return renderErrorState()
  } else {
    return renderTable({ site, branches })
  }
}

const renderTable = ({ site, branches }) => (
  <table className="usa-table-borderless" style={{marginTop: 0}}>
    {tableHeader()}
    {tableBody({ site, branches })}
  </table>
)

const tableHeader = () => (
  <thead>
    <tr>
      <th>Branch</th>
      <th></th>
    </tr>
  </thead>
)

const tableBody = ({ site, branches }) => (
  <tbody>
    {branches.data.map(branch => {
      return branchRow({ site, branch })
    })}
  </tbody>
)

const branchRow = ({ branch, site }) => (
  <tr key={branch.name}>
    <td>{branch.name}</td>
    <td>
      <a href={previewURL({ branch, site })} target="_blank">View</a>
    </td>
  </tr>
)

const previewURL = ({ branch, site }) => {
  if (branch.name === site.defaultBranch) {
    return site.viewLink
  } else if (branch.name === site.demoBranch) {
    return site.demoViewLink
  } else {
    return `/preview/${site.owner}/${site.repository}/${branch.name}/`
  }
}

const renderLoadingState = () => <LoadingIndicator/>

const renderErrorState = () => (
  <p>
    An error occured while downloading branch data from Github.
    Often this is because the repo is private or has been deleted.
  </p>
)

SiteGithubBranchesTable.propTypes = {
  site: React.PropTypes.object.isRequired,
  branches: React.PropTypes.object.isRequired,
};

export default SiteGithubBranchesTable;
