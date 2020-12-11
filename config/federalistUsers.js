const env = require('../services/environment.js')();

module.exports = {
  teams18F: [
    '18f-staff', // 3036896
    '18f-org', // 3040935
  ],
  admin: (env.FEDERALIST_USERS_ADMIN || process.env.FEDERALIST_USERS_ADMIN),
  orgName: 'federalist-users',
  maxDaysSinceLogin: process.env.MAX_DAYS_SINCE_LOGIN || 90,
};
