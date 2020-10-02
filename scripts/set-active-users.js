/* eslint-disable no-console */
const { User, Event } = require('../api/models');
const config = require('../config');
const GitHub = require('../api/services/GitHub');

const federalistOrg = config.federalistUsers.orgName;

const setActiveUsers = async () => {
  const [{ githubAccessToken }] = await User.findOne({ where: { username: config.federalistUsers.admin } });
  const members = await GitHub.getOrganizationMembers(githubAccessToken, federalistOrg);
  const logins = members.map(m => m.login.toLowerCase());
  const [, users] = await User.update({ isActive: true },
    {
      where: {
        username: logins,
        isActive: false,
      },
      returning: ['id'],
    },
  );
  users.map(user => Event.audit(Event.lablels.UPDATED, user, { action: { isActive: true } }));
};

module.exports = setActiveUsers;