import React from 'react';
import { connect } from 'react-redux';

import { SITE, GITHUB_BRANCHES } from '../../propTypes';
import LoadingIndicator from '../LoadingIndicator';
import GitHubLink from '../GitHubLink';
import BranchViewLink from '../branchViewLink';
import githubBranchActions from '../../actions/githubBranchActions';
import buildActions from '../../actions/buildActions';
import AlertBanner from '../alertBanner';
import CreateBuildLink from '../CreateBuildLink';
import validBranchName from '../../util/validators';

// we only want to link branch names that are alphanumeric plus _, -, and .
const isLinkable = s => validBranchName(s);

export class SiteGitHubBranches extends React.Component {
  componentDidMount() {
    githubBranchActions.fetchBranches(this.props.site);
  }

  renderRowActions(name, commit) {
    if (!isLinkable(name)) {
      return <span>Unlinkable branch name</span>;
    }

    return (
      <span>
        <BranchViewLink branchName={name} site={this.props.site} />
        <CreateBuildLink
          handlerParams={{ commit: commit.sha, branch: name, siteId: this.props.site.id }}
          handleClick={buildActions.createBuild}
          className="usa-button usa-button-secondary"
        >
          <br />
          Rebuild branch
        </CreateBuildLink>
      </span>
    );
  }

  renderRow({ name, commit }, { isDefault = false, isDemo = false }) {
    const { owner, repository } = this.props.site;

    return (
      <tr key={name}>
        <td>
          <GitHubLink text={name} owner={owner} repository={repository} branch={name} />
          { isDefault && ' (live branch)' }{ isDemo && ' (demo branch)' }
        </td>
        <td className="table-actions">
          {this.renderRowActions(name, commit)}
        </td>
      </tr>
    );
  }

  render() {
    const { githubBranches, site } = this.props;

    if (!site || githubBranches.isLoading) {
      return <LoadingIndicator />;
    }

    if (githubBranches.error || !githubBranches.data || !githubBranches.data.length) {
      return (
        <AlertBanner
          status="info"
          header="No branches were found for this repository."
          message="Often this is because the repository is private or has been deleted."
        />
      );
    }

    // We want to put the site's defaultBranch and demoBranch
    // first and second, respectively, in the table of branches
    // if they exist
    const regularBranches = [];
    let defaultBranch;
    let demoBranch;

    githubBranches.data.forEach((branch) => {
      if (site.defaultBranch === branch.name) {
        defaultBranch = branch;
      } else if (site.demoBranch === branch.name) {
        demoBranch = branch;
      } else {
        regularBranches.push(branch);
      }
    });

    return (
      <div>
        <p>
          This page links to every live branch of your site
          code on GitHub and to each deployed build of that code.
        </p>
        <table className="usa-table-borderless table-full-width log-table">
          <thead>
            <tr>
              <th>Branch</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            { defaultBranch && this.renderRow(defaultBranch, { isDefault: true }) }
            { demoBranch && this.renderRow(demoBranch, { isDemo: true }) }
            { regularBranches.map(branch => this.renderRow(branch, {})) }
          </tbody>
        </table>
      </div>
    );
  }
}

SiteGitHubBranches.propTypes = {
  site: SITE,
  githubBranches: GITHUB_BRANCHES,
};

SiteGitHubBranches.defaultProps = {
  site: null,
  githubBranches: null,
};

const mapStateToProps = ({ githubBranches, sites }) => ({
  githubBranches,
  site: sites.currentSite,
});

export default connect(mapStateToProps)(SiteGitHubBranches);
