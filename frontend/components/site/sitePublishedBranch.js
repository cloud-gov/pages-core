import React from 'react'
import publishedBranchActions from "../../actions/publishedBranchActions";

class SitePublishedBranch extends React.Component {
  componentDidMount() {
    const site = { id: this.props.params.id }
    const branch = this.props.params.name
    publishedBranchActions.fetchPublishedBranch(site, branch)
  }

  branch() {
    const siteId = parseInt(this.props.params.id)
    const name = this.props.params.name
    return this.props.publishedBranches.find(branch => {
      return branch.site.id === siteId && branch.name === name
    })
  }

  branchFiles() {
    const branch = this.branch()
    if (branch && branch.files) {
      return branch.files
    } else {
      return []
    }
  }

  render() {
    const branch = this.branch()
    const files = this.branchFiles()
    if (!branch) {
      return this.renderBranchEmptyState()
    } else if (!files.length) {
      return this.renderFilesEmptyState()
    } else {
      return this.renderBranchFilesTable(branch)
    }
  }

  renderBranchFilesTable(branch) {
    return <div>
      <h3>{branch.name}</h3>
      <table className="usa-table-borderless build-log-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          { this.branchFiles().map(filename => this.renderBranchFileRow(filename, branch)) }
        </tbody>
      </table>
    </div>
  }

  renderBranchFileRow(filename, branch) {
    const viewFileLink = `${branch.viewLink}/${filename}`
    return <tr key={filename}>
      <td>{filename}</td>
      <td><a href={viewFileLink}>View</a></td>
    </tr>
  }

  renderBranchEmptyState() {
    return <p>No published branch data available</p>
  }

  renderFilesEmptyState() {
    return <p>No published branch files available</p>
  }
}

export default SitePublishedBranch
