import React from 'react';
import { connect } from 'react-redux';

import { SITE, GITHUB_BRANCHES } from '../../propTypes';
import LoadingIndicator from '../LoadingIndicator';
import GitHubLink from '../GitHubLink/GitHubLink';
import GitHubMark from '../GitHubMark';
import BranchViewLink from '../branchViewLink';
import githubBranchActions from '../../actions/githubBranchActions';
import AlertBanner from '../alertBanner';

export class SiteGitHubBranches extends React.Component {
  componentDidMount() {
    githubBranchActions.fetchBranches(this.props.site);
  }

  render() {
    const githubBranches = this.props.githubBranches;
    const site = this.props.site;

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
      if (site.defaultBranch && site.defaultBranch === branch.name) {
        defaultBranch = branch;
      } else if (site.demoBranch && site.demoBranch === branch.name) {
        demoBranch = branch;
      } else {
        regularBranches.push(branch);
      }
    });


    const branchRow = ({ name }, { isDefault = false, isDemo = false }) => (
      <tr key={name}>
        <td>
            <GitHubLink owner={site.owner} repository={site.repository} branch={name}>
              { name } { isDefault && '(live branch)' } { isDemo && '(demo branch)' }
              <GitHubMark />
            </GitHubLink>
        </td>
        <td>
          <BranchViewLink branchName={name} site={site} />
        </td>
      </tr>
    );

    return (
      <div>
        <p>
          This page links to every live branch of your site
          code on GitHub and to each deployed build of that code.
        </p>
        <table className="usa-table-borderless">
          <thead>
            <tr>
              <th>Branch</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            { defaultBranch && branchRow(defaultBranch, { isDefault: true }) }
            { demoBranch && branchRow(demoBranch, { isDemo: true }) }
            { regularBranches.map(branchRow) }
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


const mapStateToProps = ({ githubBranches }) => ({ githubBranches });

export default connect(mapStateToProps)(SiteGitHubBranches);
