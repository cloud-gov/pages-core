import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import publishedFileActions from '../../actions/publishedFileActions';
import { currentSite } from '../../selectors/site';
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

    this.previousPage = this.previousPage.bind(this);
    this.nextPage = this.nextPage.bind(this);
  }

  componentDidMount() {
    const { id, name } = this.props;

    const site = { id };
    const branch = name;

    const startAtKey = null; // start without a startAtKey
    publishedFileActions.fetchPublishedFiles(site, branch, startAtKey);
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { publishedFiles } = nextProps;

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
    const { currentPage } = this.state;
    return !currentPage;
  }

  previousPage() {
    const { currentPage } = this.state;
    if (currentPage > 0) {
      this.setState({ currentPage: currentPage - 1 });
    }
  }

  shouldDisableNextPage() {
    const { currentPage, lastPage } = this.state;
    return currentPage === lastPage;
  }

  nextPage() {
    const { id, name } = this.props;
    const { currentPage, filesByPage } = this.state;

    const nextPage = currentPage + 1;

    if (this.shouldDisableNextPage()) {
      // do nothing if already on the known last page
      return;
    }

    this.setState({ currentPage: nextPage });

    if (filesByPage[nextPage]) {
      // short-circuit if already have next files in state
      return;
    }

    // else dispatch action to fetch next page of files
    const site = { id };
    const branch = name;
    const files = filesByPage[currentPage];
    const startAtKey = files[files.length - 1].key;

    publishedFileActions.fetchPublishedFiles(site, branch, startAtKey);
  }

  shouldShowButtons() {
    const { lastPage } = this.state;
    if (lastPage !== null && lastPage === 0) {
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
          type="button"
        >
          &laquo; Previous
        </button>

        <button
          className={nextButtonClass}
          disabled={this.shouldDisableNextPage()}
          onClick={this.nextPage}
          title="View the next page of published files"
          type="button"
        >
          Next &raquo;
        </button>
      </nav>
    );
  }

  renderPublishedFilesTable(files) {
    const { name } = this.props;

    return (
      <div>
        <h3>{name}</h3>
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
    let viewFileLink;
    const branch = file.publishedBranch.name;
    switch (branch) {
      case file.publishedBranch.site.defaultBranch:
        viewFileLink = `${file.publishedBranch.site.viewLink}${file.name}`;
        break;
      case file.publishedBranch.site.demoBranch:
        viewFileLink = `${file.publishedBranch.site.demoViewLink}${file.name}`;
        break;
      default:
        viewFileLink = `${file.publishedBranch.site.previewLink}${branch}/${file.name}`;
    }
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
    const { publishedFiles } = this.props;
    const { currentPage, filesByPage } = this.state;

    const files = filesByPage[currentPage] || [];

    if (publishedFiles.isLoading) {
      return this.renderLoadingState();
    } if (!files.length) {
      return this.renderEmptyState();
    }
    return this.renderPublishedFilesTable(files);
  }
}

SitePublishedFilesTable.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
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

const mapStateToProps = ({ publishedFiles, sites }, { id }) => ({
  publishedFiles,
  site: currentSite(sites, id),
});

export { SitePublishedFilesTable };
export default connect(mapStateToProps)(SitePublishedFilesTable);
