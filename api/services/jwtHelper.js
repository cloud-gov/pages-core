const jwt = require('jsonwebtoken');
const config = require('../../config');

const { secret } = config.jwt;

module.exports = {

  sign: (payload, options = {}) => {
    /* eslint-disable no-param-reassign */
    options.expiresIn = options.expiresIn || '1d';
    return jwt.sign(payload, secret, options);
  },

  verify: (token, options = {}) => new Promise((resolve, reject) => {
    jwt.verify(token, secret, options, (err, decoded) => {
      if (err || !decoded) {
        return reject(err);
      }
      return resolve(decoded);
    });
  }),

};
