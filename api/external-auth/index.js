const express = require('express');
const extractDomain = require('extract-domain');
const passport = require('./passport');
const { Site, Event } = require('../models');
const EventCreator = require('../services/EventCreator');

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
app.get('/auth/github', async (req, res) => {
  const sites = await Site.findAll({ attributes: ['domain'] });
  const domains = sites.map(site => site.domain);
  const { referer } = req.headers;
  const domainMatch = extractDomain(new URL(referer).hostname);
  if ('cloud.gov'.includes(domainMatch) || domains.some(domain => domain.includes(domainMatch))) {
    // TODO: match domain? currently using site[0] as temporary instance for logging
    EventCreator.audit(Event.labels.AUTHENTICATION, sites[0], 'External auth', { referer });
    return passport.authenticate('github', { session: false })(req, res);
  }
  return res.send(script(res.locals.cspNonce, 'error', { message: 'Please login from a registered cloud.gov Pages site' }));
});
app.get('/auth/github/callback', (req, res) => {
  passport.authenticate('github', (error, user) => {
    const response = error
      ? script(res.locals.cspNonce, 'error', { message: error.message })
      : script(res.locals.cspNonce, 'success', { token: user.accessToken, provider: 'github' });

    res.send(response);
  })(req, res);
});

module.exports = app;
