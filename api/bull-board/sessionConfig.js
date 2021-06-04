const origSessionConfig = require('../init/sessionConfig');

module.exports = {
  ...origSessionConfig,
  name: 'federalist-bull-board.sid',
  // I think we only need `name`, but adding `key` for legacy
  key: 'federalist-bull-board.sid',
  // Use a different secret
  secret: `${origSessionConfig.secret}bull-board`,
};
