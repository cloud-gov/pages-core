const Passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const config = require('../../config');
const { User } = require('../models');
// const GitHub = require('../services/GitHub');

const passport = new Passport.Passport();

const adminAuthCallback = async (accessToken, _refreshToken, profile, callback) => {
  const { _json: { email }, username } = profile;
  try {
    // await GitHub.validateAdmin(accessToken);
    const user = (await User.findOrCreate({
      where: { username: username.toLowerCase() },
      defaults: { email, username },
    }))[0];

    if (!user) {
      throw new Error(`Unable to find admin user ${username}`);
    }

    return callback(null, user);
  } catch (error) {
    console.error('Admin authentication error: ', error);
    return callback(error);
  }
};

passport.use(new GitHubStrategy(config.passport.github.adminOptions, adminAuthCallback));

passport.serializeUser((user, next) => {
  console.log({ user });
  next(null, user.id);
});

passport.deserializeUser((id, next) => {
  User.findByPk(id).then((user) => {
    next(null, user);
  });
});

module.exports = passport;

// const callbackLogic = (req, res, {
//   errorMessage = 'Apologies; you don\'t have access to Federalist! '
//   + 'Please contact the Federalist team if this is in error.',
//   redirect = '/',
//   isAdmin = false,
// } = {}) => {
//   const sessionKey = isAdmin ? 'adminAuthenticated' : 'authenticated';
//   if (req.user) {
//     req.session[sessionKey] = true;
//     req.session[`${sessionKey}At`] = new Date();
//     req.session.save(() => {
//       if (req.session.authRedirectPath) {
//         res.redirect(req.session.authRedirectPath);
//       } else {
//         res.redirect(redirect);
//       }
//     });
//   } else {
//     req.flash('error', {
//       title: 'Unauthorized',
//       message: errorMessage,
//     });
//     res.redirect(redirect);
//   }
// };

// passport.callback = (req, res) => {
//   const { pathname } = url.parse(req.originalUrl);

//   if (pathname === '/admin/auth/github/callback') {
//     passport.authenticate('admin-auth')(req, res, () => {
//       callbackLogic(req, res, {
//         errorMessage: 'You don\'t have access to Federalist admin!',
//         redirect: '/admin',
//         isAdmin: true,
//       });
//     });
//   } else {
//     passport.authenticate('github')(req, res, () => {
//       callbackLogic(req, res);
//     });
//   }
// };
