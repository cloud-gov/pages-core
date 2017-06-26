import React from 'react';
import PropTypes from 'prop-types';

import publishedFileActions from '../../actions/publishedFileActions';
import LoadingIndicator from '../loadingIndicator';

class SitePublishedFilesTable extends React.Component {
  componentDidMount() {
    const site = { id: this.props.params.id };
    const branch = this.props.params.name;
    publishedFileActions.fetchPublishedFiles(site, branch);
  }

  publishedFiles() {
    const branch = this.props.params.name;
    if (this.props.publishedFiles.data && !this.props.publishedFiles.isLoading) {
      return this.props.publishedFiles.data.filter(file => file.publishedBranch.name === branch);
    }
    return [];
  }

  renderPublishedFilesTable(files) {
    return (<div>
      <h3>{this.props.params.name}</h3>
      <table className="usa-table-borderless">
        <thead>
          <tr>
            <th>File</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          { files.filter(f => !!f.name).map(this.renderBranchFileRow) }
        </tbody>
      </table>
    </div>);
  }

  renderBranchFileRow(file) {
    const viewFileLink = `${file.publishedBranch.viewLink}/${file.name}`;
    return (<tr key={file.name}>
      <td>{file.name}</td>
      <td><a href={viewFileLink} target="_blank" rel="noopener noreferrer">View</a></td>
    </tr>);
  }

  renderLoadingState() {
    return <LoadingIndicator />;
  }

  renderEmptyState() {
    return (<p>No published branch files available.</p>);
  }

  render() {
    const files = this.publishedFiles();
    if (this.props.publishedFiles.isLoading) {
      return this.renderLoadingState();
    } else if (!files.length) {
      return this.renderEmptyState();
    }
    return this.renderPublishedFilesTable(files);
  }
}

SitePublishedFilesTable.propTypes = {
  params: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  publishedFiles: PropTypes.shape({
    isLoading: PropTypes.bool.isRequired,
    data: PropTypes.array,
  }),
};

SitePublishedFilesTable.defaultProps = {
  publishedFiles: null,
};

export default SitePublishedFilesTable;
