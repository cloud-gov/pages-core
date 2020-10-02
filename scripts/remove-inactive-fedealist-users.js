/* eslint-disable no-console */
const moment = require('moment');
const { Op } = require('sequelize');
const { User, Event } = require('../api/models');
const config = require('../config');
const GitHub = require('../api/services/GitHub');
const EventCreator = require('../api/services/EventCreator');

const federalistOrg = config.federalistUsers.orgName;

const DAYS_SINCE_LOGIN = process.env.DAYS_SINCE_LOGIN || 90;

const removeMembers = (githubAccessToken, logins) => {
  logins.forEach((login) => GitHub.removeOrganizationMember(githubAccessToken, federalistOrg, login)
    .catch(error => EventCreator.error(Event.labels.FEDERALIST_USERS, { error, login, action: 'removeOrgMember' })));
}

// remove users from org who are not using Federalist
const removeInactiveAuthenticatedUsers =  async (githubAccessToken, cutofff, memberLogins) => {
  const inActiveUsers = User.findAll({
    attributes: ['id', 'username'],
    where: {
      isActive: true,
      signedInAt: {
        [Op.lt]: cutoff.toDate(),
      },
      username: memberLogins.map(login => login.toLowerCase()),
    },
  });

  const inActiveUsernames = inActiveUsers.map(user => user.username.toLowerCase());

  removeMembers(githubAccessToken, inActiveUsernames);
}

// remove org members (> x days) that are not in users table
const removeMembersNotInUserTable = async (githubAccessToken, cutoff, memberLogins) => {
  const allUsers = await User.findAll({
    attributes: ['username'],
  });

  const allUsernames = allUsers.map(u => u.username.toLowerCase());
  
  const memberLoginsNotInUserTable = memberLogins.filter(memberLogin => !allUsernames.includes(memberLogin.toLowerCase()));

  const memberAddedEvents = await Event.findAll( // find members added within cutoff date
  {
    attributes: ['body #>> \'{membership,user,login}\'', 'login'],
    where: {
      type: Event.types.AUDIT,
      label: Event.labels.FEDERALIST_USERS,
      signedInAt: {
        [Op.gte]: cutoff.toDate(),
      },
      body: {
        action:
        {
          [Op.eq]: 'member_added',
        },
      },
      body: {
        'membership.user.login': {
          [Op.in]: memberLoginsNotInUserTable,
        },
      },
    },
  });

  const recentlyAddedMemberLoginsNotInUserTable = memberAddedEvents.map(m => m.login);

  const membersToRemove = memberLoginsNotInUserTable
    .filter(memberLogin => !recentlyAddedMemberLoginsNotInUserTable.includes(memberLogin));

  removeMembers(githubAccessToken, membersToRemove);
}

const removeInactiveMembers = async () => {
  const now = moment(new Date());
  const cutoff = now.clone().subtract(DAYS_SINCE_LOGIN, 'days');

  const [{ githubAccessToken }] = await User.findOne({ where: { username: config.federalistUsers.admin } });

  const members = await GitHub.getOrganizationMembers(githubAccessToken, config.federalistUsers.orgName);
  const memberLogins = members.map(m => m.login);

  removeInactiveAuthenticatedMembers(githubAccessToken, cutoff, memberLogins);
  removeMembersNotInUserTable(githubAccessToken, cutoff, memberLogins);
}
module.exports = removeInactiveMembers;
