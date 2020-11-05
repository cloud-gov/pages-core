/* eslint-disable no-console */
const { refreshIsActiveUsers } = require('../api/services/FederalistUsersHelper');

refreshIsActiveUsers()
  .catch((err) => {
    console.error(err);
    throw err;
  });
