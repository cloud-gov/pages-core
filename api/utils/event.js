const types = {
  ERROR: 'error',
  AUDIT: 'audit',
};

const labels = {
  TIMING: 'timing',
  ADDED: 'added',
  REMOVED: 'removed',
  UPDATED: 'updated',
  AUTHENTICATION: 'authentication',
};

const modelNames = [
  'Build', 'Site', 'BuildLog', 'User',
  'UserEnvironmentVariable', 'SiteUser',
];

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

const isValidModel = (value) => {
  if (!modelNames.includes(value)) {
    throw new Error(`Invalid event model: ${value}`);
  }
}

module.exports = { types, labels, isValidLabel, isValidType, isValidModel };
