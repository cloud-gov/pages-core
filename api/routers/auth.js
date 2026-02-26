const router = require('express').Router();
const { Event, User } = require('../models');
const passport = require('../services/passport');
const EventCreator = require('../services/EventCreator');

function redirectIfAuthenticated(req, res, next) {
  req.session.authenticated ? res.redirect('/') : next();
}

function uaaCallback(req, res, next) {
  // provide this interior callback in place of the default passport.
  // authenticate behavior:
  // https://github.com/jaredhanson/passport/blob/master/lib/middleware/authenticate.js#L34
  passport.authenticate('uaa', (err, user, info) => {
    if (err) {
      return res.unauthorized();
    }
    if (user) {
      return req.logIn(user, next);
    }
    // no user, no error
    req.session.flash = {
      error: [info.message],
    };
    return res.redirect('/');
  })(req, res, next);
}

function onSuccess(req, res) {
  req.session.authenticated = true;
  req.session.authenticatedAt = new Date();
  req.session.save(() => {
    res.redirect(req.session.authRedirectPath || '/');
  });
}

// Callbacks need to be registered with CF UAA service
router.get('/logout', passport.logout());
router.get('/login', redirectIfAuthenticated, passport.authenticate('uaa'));
router.get('/auth/uaa/callback', uaaCallback, onSuccess);
router.get('/auth/uaa/logout', (_req, res) => res.redirect('/'));

// New Github authorization only routes
const onGithubSuccess = async (req, res) => {
  const githubUser = req.user;

  const user = await User.findByPk(req.session.passport.user);
  await user.update({
    ...githubUser,
    signedInAt: new Date(),
  });

  EventCreator.audit(
    Event.labels.AUTHENTICATION_PAGES_GH_TOKEN,
    user,
    'GitHub authentication for token',
  );

  const script = `
    <script nonce="${res.locals.cspNonce}">
      window.opener.postMessage("success", "*")
    </script>
  `;

  res.send(script);
};

const onGitlabSuccess = async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  console.log(code, state);

  console.log(`GitLab RESPONSE !!!! code:${code} state:${state}`);

  const gitLabUser = req.user;

  const user = await User.findByPk(req.session.passport.user);
  await user.update({
    ...gitLabUser,
    signedInAt: new Date(),
  });

  EventCreator.audit(
    Event.labels.AUTHENTICATION_PAGES_GH_TOKEN,
    user,
    'GitLab authentication for token',
  );

  const script = `
    <script nonce="${res.locals.cspNonce}">
      window.opener.postMessage("success", "*")
    </script>
  `;

  res.send(script);
};

router.get('/auth/github2', passport.authenticate('github2')); // xxx
router.get(
  '/auth/github2/callback',
  (req, res, next) => {
    console.log('Session:', req.session);
    console.log('Cookies:', req.headers.cookie);
    console.log('State:', req.query.state);
    console.log('Code:', req.query.code);
    console.log(
      'Passport session stored state:',
      req.session.passport ? req.session.passport.state : 'none',
    );
    next();
  },
  passport.authenticate('github2', { session: false }),
  onGithubSuccess,
);
router.get(
  '/auth/gitlab1',
  (req, res, next) => {
    console.log('/auth/gitlab __________________________________________________');
    console.log('Session:', req.session);
    console.log('Cookies:', req.headers.cookie);
    console.log('State:', req.query.state);
    console.log('Code:', req.query.code);
    console.log('Res:', res);
    next();
  },
  passport.authenticate('gitlab'),
);

router.get('/auth/gitlab2', (req, res, next) => {
  // Expire GitLab session cookie

  console.log('REMOVING COOKIES !!!!!!!!!!!!!!');

  res.clearCookie('_gitlab_session', {
    domain: 'gitlab.local.com', // must match GitLab domain
    path: '/', // must match path
    httpOnly: true, // match original cookie
    secure: false, // true if using HTTPS
  });

  // Optional: clear remember me token too
  res.clearCookie('remember_user_token', {
    domain: 'gitlab.local.com',
    path: '/',
    httpOnly: true,
    secure: false,
  });

  // Proceed with OAuth redirect
  passport.authenticate('gitlab')(req, res, next);
});

router.get('/auth/gitlab', (req, res, next) => {
  // Expire cookies first
  console.log('REMOVING COOKIES !!!!!!!!!!!!!!');
  res.clearCookie('_gitlab_session', {
    domain: 'gitlab.local.com',
    path: '/',
    httpOnly: true,
    secure: false,
  });
  res.clearCookie('remember_user_token', {
    domain: 'gitlab.local.com',
    path: '/',
    httpOnly: true,
    secure: false,
  });

  // Custom callback for passport
  passport.authenticate('gitlab', (err, user, info) => {
    if (err) {
      console.log('ERROR !!!!!!!!!!!!!!', { err });
      return next(err);
    }
    // This code runs **after Passport handles the request**
    console.log('Passport middleware finished', { user, info });

    // Typically for initial OAuth redirect, user will be null, info has redirect URL
    if (info && info.redirect) {
      console.log('Redirecting to GitLab:', info.redirect);
      return res.redirect(info.redirect); // continue normal OAuth flow
    }

    // Otherwise, do something else
    res.send('Done');
  })(req, res, next);
});
///

router.get(
  '/auth/gitlab/callback2',
  (req, res, next) => {
    console.log(
      '/auth/gitlab/callback __________________________________________________',
    );
    console.log('Session:', req.session);
    console.log('Cookies:', req.headers.cookie);
    console.log('State:', req.query.state);
    console.log('Code:', req.query.code);
    next();
  },
  passport.authenticate('gitlab', { session: true, failWithError: true }), // without failWithError 403 will fail silently
  onGitlabSuccess,
);

router.get('/auth/gitlab/callback', (req, res, next) => {
  passport.authenticate(
    'gitlab',
    { session: true, failWithError: true },
    (err, user, info) => {
      if (err) {
        console.error('OAuth error detail:', err); // <-- check this
        return res.status(500).json({ error: err.message });
      }
      if (!user) return res.redirect('/login');
      req.logIn(user, (err) => {
        if (err) return next(err);
        res.redirect('/');
      });
    },
  )(req, res, next);
});

module.exports = router;
