/* eslint-disable no-console */
const { revokeMembershipForInactiveUsers } = require('../api/services/FederalistUsersHelper');
const EventCreator = require('../api/services/EventCreator');
const { Event } = require('../api/models');

async function removeInactiveFederalistUsers() {
  const results = await revokeMembershipForInactiveUsers();
  const errors = results.filter(r => r.status === 'rejected').map(r => r.reason);
  if (errors.length === 0) {
    return;
  }

  errors.forEach(error => EventCreator.error(Event.labels.FEDERALIST_USERS, error));
  throw new Error('Remove inactive federalist users failed, see above for details.');
}

try {
  removeInactiveFederalistUsers();
} catch (err) {
  console.error(err);
  process.exit(1);
}
