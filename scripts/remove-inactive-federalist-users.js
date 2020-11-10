/* eslint-disable no-console */
const { revokeMembershipForInactiveUsers } = require('../api/services/FederalistUsersHelper');

revokeMembershipForInactiveUsers()
	.catch((err) => {
	  console.error(err);
	  process.exit(1);
	});
