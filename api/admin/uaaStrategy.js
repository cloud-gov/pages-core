const { Strategy } = require('passport-oauth2');

module.exports = function uaaStrategy(options, verify) {
  const { userURL, ...rest } = options;

  const opts = { ...rest, scope: ['openid'] };

  const strategy = new Strategy(opts, verify);

  strategy.userProfile = (accessToken, callback) => {
    // eslint-disable-next-line no-underscore-dangle
    strategy._oauth2.get(userURL, accessToken, (err, body) => {
      if (err) {
        return callback(err);
      }

      try {
        return callback(null, JSON.parse(body));
      } catch (e) {
        return callback(e);
      }
    });
  };

  return strategy;
};
