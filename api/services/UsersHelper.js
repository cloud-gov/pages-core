const GitHub = require('./GitHub');
const config = require('../../config');

const FEDERALIST_USERS_ORG = config.federalistUsers.orgName;

const githubUsersAdmins = githubAccessToken => GitHub.getOrganizationMembers(githubAccessToken, FEDERALIST_USERS_ORG, 'admin')
  .then(admins => admins.map(admin => admin.login));

module.exports = {
  githubUsersAdmins,
};
