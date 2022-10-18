const GitHubStrategy = require('passport-github').Strategy;
const Passport = require('passport');
const config = require('../../config');


const passport = new Passport.Passport();

const options = config.passport.github.externalOptions;
options.passReqToCallback = true;

const onSuccess = (req, accessToken, _refreshToken, _profile, callback) => {
  console.log(req)
    // check req against sites
    //    .catch(callback);
    callback(null, { accessToken });
};

passport.use(new GitHubStrategy(options, onSuccess));

module.exports = passport;
