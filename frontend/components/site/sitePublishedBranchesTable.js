import React from "react";
import { Link } from 'react-router';
import publishedBranchActions from "../../actions/publishedBranchActions";

class SitePublishedBranchesTable extends React.Component {
  componentDidMount() {
    publishedBranchActions.fetchPublishedBranches({ id: this.props.params.id })
  }

  publishedBranches() {
    if (!this.props.publishedBranches) {
      return []
    }
    return this.props.publishedBranches.filter(branch => {
      return branch.site.id === parseInt(this.props.params.id)
    })
  }

  render() {
    if (this.publishedBranches().length > 0) {
      return this.renderBuildLogsTable()
    } else {
      return this.renderLoadingState()
    }
  }

  renderBuildLogsTable() {
    return (
      <table className="usa-table-borderless build-log-table">
        <thead>
          <tr>
            <th>Branch</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          { this.publishedBranches().map(this.renderPublishedBranchRow.bind(this)) }
        </tbody>
      </table>
    )
  }

  renderPublishedBranchRow(branch) {
    return (
      <tr key={branch.name}>
        <td>{ branch.name }</td>
        <td>
          { this.renderBranchViewLink(branch) }<br />
          { this.renderBranchFilesLink(branch) }
        </td>
      </tr>
    )
  }

  renderBranchViewLink(branch) {
    return <a href={branch.viewLink} target="_blank">View</a>
  }

  renderBranchFilesLink(branch) {
    const href = `/sites/${branch.site.id}/published/${branch.name}`
    return <Link to={href}>Files</Link>
  }

  renderLoadingState() {
    return <p>No published branch data available</p>
  }
}

export default SitePublishedBranchesTable
