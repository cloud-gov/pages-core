const express = require('express');
const passport = require('./passport');
const EventCreator = require('../services/EventCreator');
const { Event } = require('../models');

const script = (nonce, status, content) => `
  <script nonce="${nonce}">
    (function() {
      function receiveMessage(e) {
        window.opener.postMessage(
          'authorization:github:${status}:${JSON.stringify(content)}',
          e.origin
        )
      }
      window.addEventListener("message", receiveMessage, false)
      // Start handshare with parent
      window.opener.postMessage("authorizing:github", "*")
    })()
  </script>
`;

const app = express();
app.disable('x-powered-by');
app.use(passport.initialize());
app.get('/auth/github', passport.authenticate('github', { session: false }));
app.get('/auth/github/callback', (req, res) => {
  passport.authenticate('github', (error, user) => {
    const response = error
      ? script(res.locals.cspNonce, 'error', { message: error.message })
      : script(res.locals.cspNonce, 'success', { token: user.accessToken, provider: 'github' });

    if (error) {
      EventCreator.error(Event.labels.AUTHENTICATION_NETLIFY_CMS, error);
    } else {
      EventCreator.audit(Event.labels.AUTHENTICATION_NETLIFY_CMS, null, 'Authenticated user with Github on Netlify CMS');
    }

    res.send(response);
  })(req, res);
});

module.exports = app;
