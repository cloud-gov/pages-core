import React from 'react';
import { connect } from 'react-redux';

import { SITE, GITHUB_BRANCHES } from '../../propTypes';
import LoadingIndicator from '../loadingIndicator';
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

    if (!githubBranches.data || !githubBranches.data.length) {
      return (
        <p>
          No branches were found for this repository.
          There may have been an error communicating with the GitHub API.
        </p>
      );
    }

    return (
      <div>
        <h4 className="label">Branches retrieved from GitHub</h4>
        <table className="usa-table-borderless">
          <thead>
            <tr>
              <th>Branch</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {
              githubBranches.data.map(({ name }) => (
                <tr key={name}>
                  <td>
                    { name }
                    {' '}
                    <GitHubRepoLink owner={site.owner} repository={site.repository} branch={name} />
                  </td>
                  <td>
                    <BranchViewLink branchName={name} site={site} />
                  </td>
                </tr>
              ))
            }
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
