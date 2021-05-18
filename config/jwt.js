const env = require('../services/environment')();

module.exports = { secret: (env.JWT_SECRET || process.env.JWT_SECRET) };
