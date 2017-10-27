import React from 'react';
import { connect } from 'react-redux';

import { SITE, GITHUB_BRANCHES } from '../../propTypes';
import LoadingIndicator from '../LoadingIndicator';
import GitHubRepoLink from '../GitHubRepoLink';
import BranchViewLink from '../branchViewLink';
import githubBranchActions from '../../actions/githubBranchActions';

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
        <p>
          No branches were found for this repository.
          Often this is because the repository is private or has been deleted.
        </p>
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
          { name } { isDefault && '(live branch)' } { isDemo && '(demo branch)' }
          {' '}
          <GitHubRepoLink owner={site.owner} repository={site.repository} branch={name} />
        </td>
        <td>
          <BranchViewLink branchName={name} site={site} />
        </td>
      </tr>
    );

    return (
      <div>
        <h4 className="label">Branches retrieved from GitHub</h4>
        <p>          
          This page links to every branch of your site&apos;s code currently live on GitHub.
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
