import React from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';
import { connect } from 'react-redux';

import publishedFileActions from '../../actions/publishedFileActions';
import LoadingIndicator from '../LoadingIndicator';
import AlertBanner from '../alertBanner';

class SitePublishedFilesTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentPage: 0,
      filesByPage: {},
      lastPage: null,
    };

    autoBind(this, 'previousPage', 'nextPage');
  }

  componentDidMount() {
    const site = { id: this.props.params.id };
    const branch = this.props.params.name;

    const startAtKey = null; // start without a startAtKey
    publishedFileActions.fetchPublishedFiles(site, branch, startAtKey);
  }

  componentWillReceiveProps(nextProps) {
    const publishedFiles = nextProps.publishedFiles;

    if (publishedFiles.data && !publishedFiles.isLoading) {
      const files = publishedFiles.data.files || [];

      const { filesByPage, currentPage } = this.state;

      // save the current page of files into state
      filesByPage[currentPage] = files;
      this.setState({ filesByPage });

      if (!publishedFiles.data.isTruncated) {
        this.setState({ lastPage: currentPage });
      }
    }
  }

  shouldDisablePreviousPage() {
    return !this.state.currentPage;
  }

  previousPage() {
    if (this.state.currentPage > 0) {
      this.setState({ currentPage: this.state.currentPage - 1 });
    }
  }

  shouldDisableNextPage() {
    return this.state.currentPage === this.state.lastPage;
  }

  nextPage() {
    const currentPage = this.state.currentPage;
    const nextPage = currentPage + 1;

    if (this.shouldDisableNextPage()) {
      // do nothing if already on the known last page
      return;
    }

    this.setState({ currentPage: nextPage });

    if (this.state.filesByPage[nextPage]) {
      // short-circuit if already have next files in state
      return;
    }

    // else dispatch action to fetch next page of files
    const site = { id: this.props.params.id };
    const branch = this.props.params.name;
    const files = this.state.filesByPage[currentPage];
    const startAtKey = files[files.length - 1].key;

    publishedFileActions.fetchPublishedFiles(site, branch, startAtKey);
  }

  shouldShowButtons() {
    if (this.state.lastPage !== null && this.state.lastPage === 0) {
      return false;
    }
    return true;
  }

  renderPagingButtons() {
    const prevButtonClass = `${this.shouldDisablePreviousPage() ? 'usa-button-disabled' : 'usa-button'}`;
    const nextButtonClass = `pull-right ${this.shouldDisableNextPage() ? 'usa-button-disabled' : 'usa-button'}`;

    if (!this.shouldShowButtons()) {
      return null;
    }

    return (
      <nav className="pagination" aria-label="Pagination">
        <button
          className={prevButtonClass}
          disabled={this.shouldDisablePreviousPage()}
          onClick={this.previousPage}
          title="View the previous page of published files"
        >&laquo; Previous</button>

        <button
          className={nextButtonClass}
          disabled={this.shouldDisableNextPage()}
          onClick={this.nextPage}
          title="View the next page of published files"
        >Next &raquo;</button>
      </nav>
    );
  }

  renderPublishedFilesTable(files) {
    return (
      <div>
        <h3>{this.props.params.name}</h3>
        <p>
          Use this page to audit the files that Federalist has publicly published.
          Up to 200 files are shown per page.
        </p>
        <table className="usa-table-borderless table-full-width log-table">
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
        { this.renderPagingButtons() }
      </div>
    );
  }

  renderBranchFileRow(file) {
    const viewFileLink = `${file.publishedBranch.site.viewLink}${file.name}`;
    return (
      <tr key={viewFileLink}>
        <td>{file.name}</td>
        <td><a href={viewFileLink} target="_blank" rel="noopener noreferrer">View</a></td>
      </tr>
    );
  }

  renderLoadingState() {
    return <LoadingIndicator />;
  }

  renderEmptyState() {
    return (
      <AlertBanner
        status="info"
        message="No published branch files available."
      />
    );
  }

  render() {
    const files = this.state.filesByPage[this.state.currentPage] || [];

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
    data: PropTypes.shape({
      files: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string,
          size: PropTypes.number,
          key: PropTypes.string,
          publishedBranch: PropTypes.shape({
            name: PropTypes.string,
          }),
        })
      ),
      isTruncated: PropTypes.bool,
    }),
  }),
};

SitePublishedFilesTable.defaultProps = {
  publishedFiles: null,
};

const mapStateToProps = ({ publishedFiles, sites }) => ({
  publishedFiles,
  site: sites.currentSite,
});

export { SitePublishedFilesTable };
export default connect(mapStateToProps)(SitePublishedFilesTable);
