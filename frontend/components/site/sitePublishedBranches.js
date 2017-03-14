import React from "react";
import publishedBranchActions from "../../actions/publishedBranchActions";

class SitePublishedBranches extends React.Component {
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
          { this.publishedBranches().map(this.renderPublishedBranchRow) }
        </tbody>
      </table>
    )
  }

  renderPublishedBranchRow(branch) {
    return (
      <tr key={branch.name}>
        <td>{ branch.name }</td>
        <td><a href={branch.viewLink}>View</a></td>
      </tr>
    )
  }

  renderLoadingState() {
    return <p>No published branch data available</p>
  }
}

export default SitePublishedBranches
