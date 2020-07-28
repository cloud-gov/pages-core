const origSessionConfig = require('../init/sessionConfig');

module.exports = {
  ...origSessionConfig,
  name: 'federalist-admin.sid',
  // I think we only need `name`, but adding `key` for legacy
  key: 'federalist-admin.sid',
  secret: `${origSessionConfig.secret}a`, // TODO - improve
};
