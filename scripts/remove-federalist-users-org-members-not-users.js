/* eslint-disable no-console */
const { removeMembersWhoAreNotUsers } = require('../api/services/FederalistUsersHelper');

removeMembersWhoAreNotUsers()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
