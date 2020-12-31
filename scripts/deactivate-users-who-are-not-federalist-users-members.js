/* eslint-disable no-console */
const { deactivateUsersWhoAreNotMembers } = require('../api/services/FederalistUsersHelper');

deactivateUsersWhoAreNotMembers()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
