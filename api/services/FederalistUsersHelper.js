const GitHub = require('./GitHub');
const { logger } = require('../../winston');
const config = require('../../config');
const EventCreator = require('./EventCreator');
const { User, Event } = require('../models');

const federalistOrg = config.federalistUsers.orgName;

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

const federalistUsersAdmins = githubAccessToken => GitHub.getOrganizationMembers(githubAccessToken, federalistOrg, 'admin')
  .then(admins => Promise.resolve(admins.map(admin => admin.login)));

const organizationAction = async(payload) => {
  const { action, memberhip, sender, organization } = payload;

  const { login: orgName } = organization;
  if (orgName !== federalistOrg) {
    logger.warn(`Not a ${federalistOrg} membership action:\t${JSON.Stringify(payload)}`);
    return;
  }

  const { user: { login } } = membership;
  const username = login.toLowerCase();
  const user = await User.findOne({ where: { username } });

  if (['member_added', 'member_removed', 'member_invited'].includes(action)) {
    await EventCreator.audit(Event.labels.FEDERALIST_USERS, user || User.build({ username }), payload);
  }

  if (user) {
    if ('member_added' === action) {
      await user.update({ isActive: true });
      EventCreator.audit(Event.labels.UPDATED, user, { action: { isActive: true } });
    }

    if ('member_removed' === action) {
      await user.update({ isActive: false });
      EventCreator.audit(Event.labels.UPDATED, user, { action: { isActive: false } });
    }
  }

}

module.exports = { audit18F, federalistUsersAdmins, organizationAction };
