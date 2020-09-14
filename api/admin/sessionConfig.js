const origSessionConfig = require('../init/sessionConfig');

module.exports = {
  ...origSessionConfig,
  name: 'federalist-admin.sid',
  // I think we only need `name`, but adding `key` for legacy
  key: 'federalist-admin.sid',
  // Use a different secret
  secret: `${origSessionConfig.secret}admin`,
};
