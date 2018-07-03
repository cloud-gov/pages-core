import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import publishedBranchActions from '../../actions/publishedBranchActions';
import LoadingIndicator from '../LoadingIndicator';
import BranchViewLink from '../branchViewLink';
import { SITE } from '../../propTypes';
import AlertBanner from '../alertBanner';

class SitePublishedBranchesTable extends React.Component {
  componentDidMount() {
    const { id } = this.props.site;
    publishedBranchActions.fetchPublishedBranches({ id });
  }

  publishedBranches() {
    if (this.props.publishedBranches.isLoading || !this.props.publishedBranches.data) {
      return [];
    }
    return this.props.publishedBranches.data;
  }

  renderPublishedBranchesTable() {
    return (
      <div>
        <p>
          Use this page to see every version of your site&apos;s code published on
          Federalist and to audit the specific files that Federalist has published.
        </p>
        <table className="usa-table-borderless published-branch-table log-table table-full-width">
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
      </div>
    );
  }

  renderPublishedBranchRow(branch) {
    return (
      <tr key={branch.name}>
        <td>{branch.name}</td>
        <td>
          <ul className="usa-unstyled-list">
            <li>
              <BranchViewLink branchName={branch.name} site={this.props.site} />
            </li>
            <li>
              {this.renderBranchFilesLink(branch)}
            </li>
          </ul>
        </td>
      </tr>
    );
  }

  renderBranchFilesLink(branch) {
    const href = `/sites/${branch.site.id}/published/${branch.name}`;
    return <Link to={href}>View files</Link>;
  }

  renderLoadingState() {
    return <LoadingIndicator />;
  }

  renderEmptyState() {
    return (
      <AlertBanner
        status="info"
        header="No branches have been published."
        message="Please wait for build to complete or check logs for error message."
      />
    );
  }

  render() {
    const branches = this.publishedBranches();
    if (this.props.publishedBranches.isLoading) {
      return this.renderLoadingState();
    } else if (!branches.length) {
      return this.renderEmptyState();
    }
    return this.renderPublishedBranchesTable();
  }
}

SitePublishedBranchesTable.propTypes = {
  publishedBranches: PropTypes.shape({
    isLoading: PropTypes.bool.isRequired,
    data: PropTypes.array,
  }),
  site: SITE,
};

SitePublishedBranchesTable.defaultProps = {
  publishedBranches: null,
  site: null,
};

const mapStateToProps = ({ publishedBranches, sites }) => ({
  publishedBranches,
  site: sites.currentSite,
});

export { SitePublishedBranchesTable };
export default connect(mapStateToProps)(SitePublishedBranchesTable);
