const { MemoryStore } = require('express-session');
const sessionConfig = require('../../config/session');

module.exports = {
  ...sessionConfig,
  name: 'federalist-bull-board.sid',
  // I think we only need `name`, but adding `key` for legacy
  key: 'federalist-bull-board.sid',
  secret: `${sessionConfig.secret}bull-board`,
  store: new MemoryStore(),
};
