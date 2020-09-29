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

const isValidType = (value) => {
  if (!Object.values(types).includes(value)) {
    throw new Error(`Invalid event type: ${value}`);
  }
}

const isValidLabel = (value) => {
  if (!Object.values(labels).includes(value)) {
    throw new Error(`Invalid event label: ${value}`);
  }
}

module.exports = { types, labels, isValidLabel, isValidType };
