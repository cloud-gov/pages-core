import React from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router';
import publishedBranchActions from '../../actions/publishedBranchActions';
import LoadingIndicator from '../LoadingIndicator';
import BranchViewLink from '../branchViewLink';
import { SITE } from '../../propTypes';

class SitePublishedBranchesTable extends React.Component {
  componentDidMount() {
    publishedBranchActions.fetchPublishedBranches({ id: this.props.params.id });
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
      <div className="usa-alert usa-alert-info" role="alert">
        <div className="usa-alert-body">
          <h3 className="usa-alert-header">No branches have been published.</h3>
          <p className="usa-alert-text">Please wait for build to complete or check logs
            for error message.</p>
        </div>
      </div>
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
  params: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
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

export default SitePublishedBranchesTable;
