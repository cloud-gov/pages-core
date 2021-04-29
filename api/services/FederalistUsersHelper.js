const { Op } = require('sequelize');
const moment = require('moment');

const GitHub = require('./GitHub');
const { logger } = require('../../winston');
const config = require('../../config');
const EventCreator = require('./EventCreator');
const { User, Event } = require('../models');

const FEDERALIST_USERS_ORG = config.federalistUsers.orgName;
const MAX_DAYS_SINCE_LOGIN = config.federalistUsers.maxDaysSinceLogin;

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
      return GitHub.getOrganizationMembers(auditor.githubAccessToken, FEDERALIST_USERS_ORG, 'admin');
    })
    .then((admins) => {
      adminFedUsers = admins.map(member => member.login);
      return Promise.all(
        fedUserTeams.map(team => GitHub.getTeamMembers(
          auditor.githubAccessToken, FEDERALIST_USERS_ORG, team
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
                auditor.githubAccessToken, FEDERALIST_USERS_ORG, member.login
              ));
              logger.info(`federalist-users: removed user ${member.login}`);
            }
          });
        });
      }
      return Promise.all(removed);
    });
};

const federalistUsersAdmins = githubAccessToken => GitHub.getOrganizationMembers(githubAccessToken, FEDERALIST_USERS_ORG, 'admin')
  .then(admins => admins.map(admin => admin.login));

const removeMemberFromFederalistUsersOrg = (githubAccessToken, login) => GitHub
  .removeOrganizationMember(githubAccessToken, FEDERALIST_USERS_ORG, login);

const revokeMembershipForInactiveUsers = async ({ auditorUsername } = {}) => {
  /* eslint-disable no-param-reassign */
  auditorUsername = auditorUsername || config.federalistUsers.admin;
  /* eslint-enable no-param-reassign */
  const now = moment();
  const cutoff = now.clone().subtract(MAX_DAYS_SINCE_LOGIN, 'days').toDate();
  const { githubAccessToken } = await User.findOne({ where: { username: auditorUsername } });
  const orgAdmins = await federalistUsersAdmins(githubAccessToken);

  const users = await User.findAll({
    attributes: ['username'],
    where: {
      isActive: true,
      signedInAt: {
        [Op.lt]: cutoff,
      },
      pushedAt: {
        [Op.lt]: cutoff,
      },
      createdAt: {
        [Op.lt]: cutoff,
      },
      username: {
        [Op.notIn]: orgAdmins.map(a => a.toLowerCase()),
      },
    },
  });

  return Promise.allSettled(users
    .map(user => removeMemberFromFederalistUsersOrg(githubAccessToken, user.username)));
};

// remove GitHub org members that are not in the user table
const removeMembersWhoAreNotUsers = async ({ auditorUsername } = {}) => {
  /* eslint-disable no-param-reassign */
  auditorUsername = auditorUsername || config.federalistUsers.admin;
  /* eslint-enable no-param-reassign */

  const { githubAccessToken } = await User.findOne({ where: { username: auditorUsername } });

  const allUsers = await User.findAll({ attributes: ['username'] });
  const allUsernames = allUsers.map(user => user.username);

  const allMembers = await GitHub
    .getOrganizationMembers(githubAccessToken, config.federalistUsers.orgName, 'member');
  const allMemberLogins = allMembers.map(member => member.login);
  const memberLoginsToRemove = allMemberLogins
    .filter(login => !allUsernames.includes(login.toLowerCase()));
  return Promise.allSettled(memberLoginsToRemove
    .map(login => removeMemberFromFederalistUsersOrg(githubAccessToken, login)));
};

const deactivateUsersWhoAreNotMembers = async ({ auditorUsername } = {}) => {
  /* eslint-disable no-param-reassign */
  auditorUsername = auditorUsername || config.federalistUsers.admin;
  /* eslint-enable no-param-reassign */
  const { githubAccessToken } = await User.findOne({ where: { username: auditorUsername } });
  const members = await GitHub.getOrganizationMembers(githubAccessToken, FEDERALIST_USERS_ORG);
  const logins = members.map(m => m.login.toLowerCase());

  const [, inactiveUsers] = await User.update({ isActive: false },
    {
      where: {
        username: { [Op.notIn]: logins },
        isActive: true,
      },
      returning: ['id', 'isActive'],
    });
  // function for 1 time init use - to be deleted
  inactiveUsers.map(user => EventCreator
    .audit(Event.labels.FEDERALIST_USERS_MEMBERSHIP, user, 'Deactivated user', { userId: user.id }));
};

module.exports = {
  audit18F,
  federalistUsersAdmins,
  revokeMembershipForInactiveUsers,
  removeMembersWhoAreNotUsers,
  deactivateUsersWhoAreNotMembers,
};
