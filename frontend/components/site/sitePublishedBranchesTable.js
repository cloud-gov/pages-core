import React from "react";
import { Link } from 'react-router';
import publishedBranchActions from "../../actions/publishedBranchActions";
import LoadingIndicator from "../loadingIndicator"

class SitePublishedBranchesTable extends React.Component {
  componentDidMount() {
    publishedBranchActions.fetchPublishedBranches({ id: this.props.params.id })
  }

  publishedBranches() {
    if (this.props.publishedBranches.isLoading || !this.props.publishedBranches.data) {
      return []
    } else {
      return this.props.publishedBranches.data
    }
  }

  render() {
    const branches = this.publishedBranches()
    if (this.props.publishedBranches.isLoading) {
      return this.renderLoadingState()
    } else if (!branches.length) {
      return this.renderEmptyState()
    } else {
      return this.renderPublishedBranchesTable()
    }
  }

  renderPublishedBranchesTable() {
    return (
      <table className="usa-table-borderless published-branch-table">
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
    return <LoadingIndicator/>
  }

  renderEmptyState() {
    return <p>
      No branches have been published.
      Please wait for build to complete or check logs for error message.
    </p>
  }
}

export default SitePublishedBranchesTable
