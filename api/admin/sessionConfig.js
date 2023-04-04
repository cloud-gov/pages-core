const origSessionConfig = require('../init/sessionConfig');

module.exports = {
  ...origSessionConfig,
  name: 'pages-admin.sid',
  // I think we only need `name`, but adding `key` for legacy
  key: 'pages-admin.sid',
  // Use a different secret
  secret: `${origSessionConfig.secret}admin`,
};
