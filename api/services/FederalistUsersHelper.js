const GitHub = require('./GitHub');
const { logger } = require('../../winston');
const config = require('../../config');

const { User } = require('../models');

const federalistOrg = 'federalist-users';

const audit18F = ({ auditorUsername, fedUserTeams }) => {
  /* eslint-disable no-param-reassign */
  auditorUsername = auditorUsername || config.federalistUsers.admin;
  fedUserTeams = fedUserTeams || config.federalistUsers.teams18F;
  /* eslint-enable no-param-reassign */

  let members18F;
  let adminFedUsers;
  let auditor;

  return User.findOne({ where: { username: auditorUsername } })
    .then((_auditor) => {
      auditor = _auditor;
      return GitHub.getOrganizationMembers(auditor.githubAccessToken, '18F');
    })
    .then((members) => {
      members18F = members.map(member => member.login);
      return GitHub.getOrganizationMembers(auditor.githubAccessToken, federalistOrg, 'admin');
    })
    .then((admins) => {
      adminFedUsers = admins.map(member => member.login);
      return Promise.all(
        fedUserTeams.map(team => GitHub.getTeamMembers(
          auditor.githubAccessToken, federalistOrg, team
        ))
      );
    })
    .then((teams) => {
      const removed = [];
      if (members18F.length > 0) {
        teams.forEach((team) => {
          team.forEach((member) => {
            if (!members18F.includes(member.login) && !adminFedUsers.includes(member.login)) {
              removed.push(GitHub.removeOrganizationMember(
                auditor.githubAccessToken, federalistOrg, member.login
              ));
              logger.info(`federalist-users: removed user ${member.login}`);
            }
          });
        });
      }
      return Promise.all(removed);
    });
};

const federalistUsersAdmins = auditorUsername => User
  .findOne({ where: { username: auditorUsername } })
  .then(auditor => GitHub.getOrganizationMembers(auditor.githubAccessToken, federalistOrg, 'admin'))
  .then(admins => Promise.all(admins.map(admin => admin.login)));

module.exports = { audit18F, federalistUsersAdmins };
