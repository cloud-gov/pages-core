const express = require('express');
const passport = require('./passport');

const onSuccess = (req, res) => {
  // https://github.com/vencax/netlify-cms-github-oauth-provider/blob/master/index.js
  const content = JSON.stringify({
    token: req.user.accessToken,
    provider: 'github',
  });

  const script = `
    <script>
      (function() {
        function receiveMessage(e) {
          window.opener.postMessage(
            'authorization:github:success:${content}',
            e.origin
          )
        }
        window.addEventListener("message", receiveMessage, false)
        // Start handshare with parent
        window.opener.postMessage("authorizing:github", "*")
      })()
    </script>
  `;

  res.send(script);
};

const app = express();
app.use(passport.initialize());
app.get('/auth/github', passport.authenticate('github', { session: false }));
app.get('/auth/github/callback', passport.authenticate('github', { session: false }), onSuccess);

module.exports = app;
