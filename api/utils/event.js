const types = {
  ERROR: 'error',
  AUDIT: 'audit',
};

const labels = {
  TIMING: 'timing',
  ADDED: 'added',
  REMOVED: 'removed', // ie: site/site-user/infrastructure removed
  UPDATED: 'updated', // ie: site settings updated, build status change
  AUTHENTICATION: 'authentication', // ie: everytime user authenticated
};

module.exports = { types, labels };
