import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from '@reach/router';
import publishedBranchActions from '../../actions/publishedBranchActions';
import { currentSite } from '../../selectors/site';
import LoadingIndicator from '../LoadingIndicator';
import BranchViewLink from '../branchViewLink';
import globals from '../../globals';
import { SITE } from '../../propTypes';
import AlertBanner from '../alertBanner';

class SitePublishedBranchesTable extends React.Component {
  componentDidMount() {
    const { site: { id } } = this.props;
    publishedBranchActions.fetchPublishedBranches({ id });
  }

  publishedBranches() {
    const { publishedBranches } = this.props;
    if (publishedBranches.isLoading || !publishedBranches.data) {
      return [];
    }
    return publishedBranches.data;
  }

  renderPublishedBranchesTable() {
    return (
      <div>
        <p>
          Use this page to see every version of your site&apos;s code published on
          {` ${globals.APP_NAME} `}
          and to audit the specific files that
          {` ${globals.APP_NAME} `}
          has published.
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
    const { site } = this.props;
    return (
      <tr key={branch.name}>
        <td>{branch.name}</td>
        <td>
          <ul className="usa-unstyled-list">
            <li>
              <BranchViewLink branchName={branch.name} site={site} />
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
    const { publishedBranches } = this.props;
    const branches = this.publishedBranches();
    if (publishedBranches.isLoading) {
      return this.renderLoadingState();
    }

    if (!branches.length) {
      return this.renderEmptyState();
    }
    return this.renderPublishedBranchesTable();
  }
}

SitePublishedBranchesTable.propTypes = {
  publishedBranches: PropTypes.shape({
    isLoading: PropTypes.bool.isRequired,
    data: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        site: PropTypes.shape({
          id: PropTypes.number,
        }),
      })
    ),
  }),
  site: SITE,
};

SitePublishedBranchesTable.defaultProps = {
  publishedBranches: null,
  site: null,
};

const mapStateToProps = ({ publishedBranches, sites }, { id }) => ({
  publishedBranches,
  site: currentSite(sites, id),
});

export { SitePublishedBranchesTable };
export default connect(mapStateToProps)(SitePublishedBranchesTable);
