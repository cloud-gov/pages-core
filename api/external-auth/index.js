const express = require('express');
const passport = require('./passport');

const onSuccess = (req, res) => {
  const { accessToken: token, message } = req.user;
  // https://github.com/vencax/netlify-cms-github-oauth-provider/blob/master/index.js
  let status;
  let content;
  if (message) {
    status = 'error';
    content = { message };
  } else {
    status = 'success';
    content = {
      token,
      provider: 'github',
    };
  }

  const script = `
    <script nonce="${res.locals.cspNonce}">
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
  res.send(script);
};

const app = express();
app.use(passport.initialize());
app.get('/auth/github', passport.authenticate('github', { session: false }));
app.get('/auth/github/callback', passport.authenticate('github', { session: false }), onSuccess);

module.exports = app;
