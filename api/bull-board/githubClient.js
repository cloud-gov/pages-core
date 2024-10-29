const { Octokit } = require('@octokit/rest');
const config = require('./config');

/**
 * A wrapper around the Octokit REST Github API
 */
class GithubClient {
  /**
   * @param {string} accessToken  - A Github OAuth access token
   */
  constructor(accessToken) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  /**
   * @param {string} username - a Github username
   *
   * Verifies that the Github user is a Federalist admin
   */
  async ensureFederalistAdmin(username) {
    const {
      data: { state, role },
    } = await this.octokit.teams.getMembershipForUserInOrg({
      org: config.admin.org,
      team_slug: config.admin.team,
      username,
    });

    if (state !== 'active' || !['member', 'maintainer'].includes(role)) {
      throw new Error(`You are not a ${config.product} admin.`);
    }
  }
}

module.exports = GithubClient;
