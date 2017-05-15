import React from 'react'
import publishedFileActions from "../../actions/publishedFileActions";
import LoadingIndicator from '../loadingIndicator'

class SitePublishedBranch extends React.Component {
  componentDidMount() {
    const site = { id: this.props.params.id }
    const branch = this.props.params.name
    publishedFileActions.fetchPublishedFiles(site, branch)
  }

  publishedFiles() {
    const branch = this.props.params.name
    if (this.props.publishedFiles.data && !this.props.publishedFiles.isLoading) {
      return this.props.publishedFiles.data.filter(file => {
        return file.publishedBranch.name === branch
      })
    } else {
      return []
    }
  }

  render() {
    const files = this.publishedFiles()
    if (this.props.publishedFiles.isLoading) {
      return this.renderLoadingState()
    } else if (!files.length) {
      return this.renderEmptyState()
    } else {
      return this.renderPublishedFilesTable(files)
    }
  }

  renderPublishedFilesTable(files) {
    return <div>
      <h3>{this.props.params.name}</h3>
      <table className="usa-table-borderless build-log-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          { files.map(file => this.renderBranchFileRow(file)) }
        </tbody>
      </table>
    </div>
  }

  renderBranchFileRow(file) {
    const viewFileLink = `${file.publishedBranch.viewLink}/${file.name}`
    return <tr key={file.name}>
      <td>{file.name}</td>
      <td><a href={viewFileLink} target="_blank">View</a></td>
    </tr>
  }

  renderLoadingState() {
    return <LoadingIndicator/>
  }

  renderEmptyState() {
    return <p>No published branch files available</p>
  }
}

export default SitePublishedBranch
