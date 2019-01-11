const env = require('../services/environment.js')();

module.exports = {
  teams18F: [
    3036896, // 18F-Staff
    3040935, // 18F-org
  ],
  admin: (env.FEDERALIST_USERS_ADMIN || process.env.FEDERALIST_USERS_ADMIN),
};
