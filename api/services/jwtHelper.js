const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
module.exports = {
  // warning: the payload must be an object for expiresIn to work ... bug???
  sign: (payload, options = { expiresIn: '1d' }) => jwt.sign(payload, secret, options),

  verify: (token, options = {}) => new Promise((resolve, reject) => {
    jwt.verify(token, secret, options, (err, decoded) => {
      if (err || !decoded) {
        return reject(err);
      }
      resolve(decoded);
    });
  }),
}