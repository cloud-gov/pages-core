/* eslint-disable no-console */
const { removeInactiveMembers, removeMembersWhoAreNotUsers } = require('../api/services/FederalistUsersHelper');

removeInactiveMembers();
removeMembersWhoAreNotUsers();
