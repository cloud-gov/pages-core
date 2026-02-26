const GitHubStrategy = require('passport-github').Strategy;
const GitLabStrategy = require('passport-gitlab2').Strategy;
const Passport = require('passport');
const config = require('../../config');
const { logger } = require('../../winston');
const { User, Event } = require('../models');
const EventCreator = require('./EventCreator');
const { createUAAStrategy, verifyUAAUser } = require('./uaaStrategy');

const passport = new Passport.Passport();
const flashMessage = {
  // eslint-disable-next-line max-len
  message: `Apologies; you are not authorized to access ${config.app.appName}! Please contact the ${config.app.appName} team if this is in error.`,
};

passport.serializeUser((user, next) => {
  next(null, user.id);
});

passport.deserializeUser((id, next) => {
  User.scope('withUAAIdentity')
    .findByPk(id)
    .then((user) => {
      next(null, user);
    });
});

/**
 * Github Auth
 */
const {
  github: { authorizationOptions: githubAuthorizationOptions },
  gitlab: { authorizationOptions: gitlabAuthorizationOptions },
} = config.passport;

// const gitlabAuthorizationOptions2 =    {
//     clientID: "2bb0ad290c8dad08443c774e0f5f7c9293e6c2760b8e9f96e4b38a6dc16d4cd7",
//     clientSecret: "gloas-8a691896f473d9bad96a34ff8cdb88aef4c63b952c147c6e7279a65e2e51b1ea",
//     doneURL: "http://gitlab.local.com:1337/auth/gitlab/done",
//     // baseURL: "http://gitlab.com" // Change if using self-hosted GitLab
//     baseURL: "http://gitlab.local.com:8929",
//     scope: ['read_repository api'],
//     state: 'aaaaaaa',
//     responseType: 'code'
//   };

async function verifyGithub2(accessToken, _refreshToken, profile, done) {
  try {
    const username = profile.username.toLowerCase();
    const { email } = profile._json;

    const user = {
      username,
      email,
      githubAccessToken: accessToken,
      githubUserId: profile.id,
    };

    EventCreator.audit(
      Event.labels.AUTHENTICATION_PAGES_GH_TOKEN,
      null,
      'User authenticated',
      {
        user,
      },
    );

    return done(null, user);
  } catch (err) {
    EventCreator.error(Event.labels.AUTHENTICATION_PAGES_GH_TOKEN, err);
    logger.warn('Github authentication error: ', err);
    return done(err);
  }
}

async function verifyGitLab(req, accessToken, refreshToken, params, profile, done) {
  // xxx
  try {
    // Access tokens expire after two hours.
    // Integrations that use access tokens must generate new ones
    // using the refresh_token attribute.
    // Refresh tokens may be used even after the access_token itself expires.
    // See OAuth 2.0 token documentation for more detailed
    // information on how to refresh expired access tokens.
    //
    // This expiration setting is set in the GitLab codebase
    // using the access_token_expires_in configuration from Doorkeeper,
    // the library that provides GitLab as an OAuth provider functionality.
    // The expiration setting is not configurable.
    //
    // When applications are deleted, all grants and tokens
    // associated with the application are also deleted.

    const expiresIn = params.expires_in;
    const createdAt = params.created_at;

    console.log('verifyGitLab !!!!!!!!!!!!!!');
    console.log(`accessToken: ${accessToken}`);
    console.log(`refreshToken: ${refreshToken}`);
    console.log(`gitlabExpiresAt: ${params.expires_in}`);

    const username = profile.username.toLowerCase();
    const { email } = profile._json;

    const user = {
      username,
      email,
      gitlabToken: accessToken,
      gitlabRefreshToken: refreshToken,
      gitlabExpiresAt: params.expires_in
    };

    console.log(user);

    EventCreator.audit(
      Event.labels.AUTHENTICATION_PAGES_GL_TOKEN,
      null,
      'User authenticated',
      {
        user,
      },
    );

    return done(null, user);
  } catch (err) {
    EventCreator.error(Event.labels.AUTHENTICATION_PAGES_GL_TOKEN, err);
    logger.warn('GitLub authentication error: ', err);
    return done(err);
  }
}

passport.use('github2', new GitHubStrategy(githubAuthorizationOptions, verifyGithub2)); // xx
passport.use('gitlab', new GitLabStrategy(gitlabAuthorizationOptions, verifyGitLab)); // xx

//
// const GitLabStrategy = require('passport-gitlab2').Strategy;
//
// passport.use(
//   new GitLabStrategy(
//     {
//       clientID: process.env.GITLAB_ID,
//       clientSecret: process.env.GITLAB_SECRET,
//       doneURL: 'http://localhost:1337/auth/gitlab/done',
//       baseURL: 'http://gitlab.local.com:8929',
//       passReqTodone: true
//     },
//     async(req, accessToken, refreshToken, params, profile, done) => {
//        done(null, {
//         profile,
//         accessToken,
//         refreshToken,
//         expiresIn: params.expires_in,
//         createdAt: params.created_at
//       });
//     }
//   )
// );
//

let uaaLogoutRedirectURL = '';

/**
 * UAA Auth
 */

const uaaOptions = {
  ...config.passport.uaa.options,
  doneURL: `${config.app.hostname}/auth/uaa/done`,
  logoutdoneURL: `${config.app.hostname}/auth/uaa/logout`,
};

const verifyUAA = async (accessToken, refreshToken, profile, done) => {
  try {

    const { user } = await verifyUAAUser(accessToken, refreshToken, profile);

    if (!user) return done(null, false, flashMessage);

    await user.update({
      signedInAt: new Date(),
    });

    EventCreator.audit(Event.labels.AUTHENTICATION, user, 'UAA login');

    return done(null, user);
  } catch (err) {

    EventCreator.error(Event.labels.AUTHENTICATION, err, { profile });
    return done(err);
  }
};

const uaaStrategy = createUAAStrategy(uaaOptions, verifyUAA);

passport.use('uaa', uaaStrategy);

uaaLogoutRedirectURL = uaaStrategy.logoutRedirectURL;

passport.logout = () => (req, res) => {
  const { user } = req;

  req.logout((logoutError) => {
    if (logoutError) {
      EventCreator.error(Event.labels.AUTHENTICATION, logoutError, { user });
      return res.redirect(config.app.hostname);
    }

    if (user) {
      EventCreator.audit(Event.labels.AUTHENTICATION, user, 'logout');
    }

    return res.redirect(uaaLogoutRedirectURL);
  });
};

module.exports = passport;
