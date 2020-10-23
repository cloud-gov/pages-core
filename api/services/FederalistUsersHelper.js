const { Op } = require('sequelize');
const moment = require('moment');

const GitHub = require('./GitHub');
const { logger } = require('../../winston');
const config = require('../../config');
const EventCreator = require('./EventCreator');
const { User, Event } = require('../models');

const FEDERALIST_ORG = config.federalistUsers.orgName;
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
      return GitHub.getOrganizationMembers(auditor.githubAccessToken, FEDERALIST_ORG, 'admin');
    })
    .then((admins) => {
      adminFedUsers = admins.map(member => member.login);
      return Promise.all(
        fedUserTeams.map(team => GitHub.getTeamMembers(
          auditor.githubAccessToken, FEDERALIST_ORG, team
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
                auditor.githubAccessToken, FEDERALIST_ORG, member.login
              ));
              logger.info(`federalist-users: removed user ${member.login}`);
            }
          });
        });
      }
      return Promise.all(removed);
    });
};

const federalistUsersAdmins = githubAccessToken => GitHub.getOrganizationMembers(githubAccessToken, FEDERALIST_ORG, 'admin')
  .then(admins => admins.map(admin => admin.login));

const refreshIsActiveUsers = async (auditorUsername = config.federalistUsers.admin) => {
  const { githubAccessToken } = await User.findOne({ where: { username: auditorUsername } });
  const members = await GitHub.getOrganizationMembers(githubAccessToken, FEDERALIST_ORG);
  const logins = members.map(m => m.login.toLowerCase());
  const [, activeUsers] = await User.update({ isActive: true },
    {
      where: {
        username: { [Op.in]: logins },
        isActive: false,
      },
      returning: ['id', 'isActive'],
    });

  const [, inActiveUsers] = await User.update({ isActive: false },
    {
      where: {
        username: { [Op.notIn]: logins },
        isActive: true,
      },
      returning: ['id', 'isActive'],
    });
  const users = activeUsers.concat(inActiveUsers);
  users.map(user => EventCreator.audit(Event.labels.UPDATED, user, {
    action: { isActive: user.isActive },
  }));
};

const removeMember = (githubAccessToken, login) => GitHub
  .removeOrganizationMember(githubAccessToken, FEDERALIST_ORG, login)
  .catch(error => EventCreator.error(Event.labels.FEDERALIST_USERS, { error, login, action: 'removeOrgMember' }));

// remove users from org who are not using Federalist
const removeInactiveAuthenticatedMembers = async (githubAccessToken, cutoff, memberLogins) => {
  const inactiveUsers = await User.findAll({
    attributes: ['id', 'username'],
    where: {
      isActive: true,
      signedInAt: {
        [Op.lt]: cutoff.toDate(),
      },
      username: {
        [Op.in]: memberLogins.map(login => login.toLowerCase()),
      },
    },
  });

  const inactiveUsernames = inactiveUsers.map(user => user.username.toLowerCase());

  return Promise.all(inactiveUsernames
    .map(inactiveUsername => removeMember(githubAccessToken, inactiveUsername)));
};

// remove org members (> x days) that are not in users table
const removeInactiveNeverAuthenticatedMembers = async (githubAccessToken, cutoff, memberLogins) => {
  const allAuthedUsers = await User.findAll({
    attributes: ['username'],
    where: {
      signedInAt: {
        [Op.ne]: null,
      },
    },
  });

  const allAuthedUsernames = allAuthedUsers.map(u => u.username.toLowerCase());

  const memberLoginsNeverAuthed = memberLogins
    .filter(memberLogin => !allAuthedUsernames.includes(memberLogin.toLowerCase()));

  const recentMemberAddedEvents = await Event.findAll({ // find members added within cutoff date
    attributes: ['body'],
    where: {
      type: Event.types.AUDIT,
      label: Event.labels.FEDERALIST_USERS,
      createdAt: {
        [Op.gte]: cutoff.toDate(),
      },
      body: {
        [Op.and]: [
          {
            action: { [Op.eq]: 'member_added' },
          },
          {
            'membership,user,login': { [Op.in]: memberLoginsNeverAuthed },
          },
        ],
      },
    },
  });

  const recentlyAddedMembersNeverAuthed = recentMemberAddedEvents
    .map(m => m.body.membership.user.login);

  const membersToRemove = memberLoginsNeverAuthed
    .filter(memberLogin => !recentlyAddedMembersNeverAuthed.includes(memberLogin));

  return Promise.all(membersToRemove
    .map(memberToRemove => removeMember(githubAccessToken, memberToRemove)));
};

const removeInactiveMembers = async ({ auditorUsername }) => {
  /* eslint-disable no-param-reassign */
  auditorUsername = auditorUsername || config.federalistUsers.admin;
  /* eslint-enable no-param-reassign */
  const now = moment(new Date());
  const cutoff = now.clone().subtract(MAX_DAYS_SINCE_LOGIN, 'days');
  const { githubAccessToken } = await User.findOne({ where: { username: auditorUsername } });

  const members = await GitHub
    .getOrganizationMembers(githubAccessToken, config.federalistUsers.orgName);

  const memberLogins = members.map(m => m.login);

  await removeInactiveAuthenticatedMembers(githubAccessToken, cutoff, memberLogins);
  await removeInactiveNeverAuthenticatedMembers(githubAccessToken, cutoff, memberLogins);
};
module.exports = {
  audit18F, federalistUsersAdmins, refreshIsActiveUsers, removeInactiveMembers,
};
