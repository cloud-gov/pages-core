import React from 'react';

const branchRow = ({ branch, site }) => (
  <tr key={branch.name}>
    <td>{branch.name}</td>
    <td>
      <a href={previewURL({ branch, site })}>View</a>
    </td>
  </tr>
)

const previewURL = ({ branch, site }) => {
  if (branch.name === site.defaultBranch) {
    return site.viewLink
  } else {
    return `/preview/${site.owner}/${site.repository}/${branch.name}/`
  }
}

const tableBody = (site) => {
  if (site.branches && site.branches.length) {
    return (
      <tbody>
        {site.branches.map(branch => {
          return branchRow({ site, branch })
        })}
      </tbody>
    )
  } else {
    return <tbody><tr><td>No branch data</td></tr></tbody>
  }
}

const tableHeader = () => (
  <thead>
    <tr>
      <th>Branch</th>
      <th></th>
    </tr>
  </thead>
)

const SitePreviewLinksTable = ({ site }) => (
  <table className="usa-table-borderless">
    {tableHeader()}
    {tableBody(site)}
  </table>
)

SitePreviewLinksTable.propTypes = {
  site: React.PropTypes.object.isRequired,
};

export default SitePreviewLinksTable;
