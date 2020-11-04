/* eslint-disable no-console */
const { revokeMembershipForInactiveUsers, removeMembersWhoAreNotUsers } = require('../api/services/FederalistUsersHelper');

Promise.all([
	revokeMembershipForInactiveUsers(),
	removeMembersWhoAreNotUsers()
])
.catch(logger.);
