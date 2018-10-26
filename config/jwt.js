const env = require('../services/environment.js')();

module.exports = { secret: (env.JWT_SECRET || process.env.JWT_SECRET) };
