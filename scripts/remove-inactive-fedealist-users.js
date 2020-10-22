/* eslint-disable no-console */
const { removeInactiveMembers } = require('../api/services/FederalistUsersHelper');

await removeInactiveMembers();