const router = require('express').Router();
const AuthController = require('../controllers/auth');

const { foobar } = require('../services/passport');

router.get('/auth/github', AuthController.github);
router.get('/auth/github/callback', AuthController.callback);
router.get('/auth/github/external', foobar.authenticate('foobar', { session: false }));
router.get('/auth/github/callback/external', foobar.authenticate('foobar'), (req, res) => {
  // https://github.com/vencax/netlify-cms-github-oauth-provider/blob/master/index.js
  const content = {
    token: req.user.accessToken,
    provider: 'github'
  }
  const script = `<script>
    (function() {
      function receiveMessage(e) {
        console.log("receiveMessage %o", e)
        // send message to main window with da app
        window.opener.postMessage(
          'authorization:github:success:${JSON.stringify(content)}',
          e.origin
        )
      }
      window.addEventListener("message", receiveMessage, false)
      // Start handshare with parent
      console.log("Sending message: %o", "github")
      window.opener.postMessage("authorizing:github", "*")
    })()
  </script>`

  res.send(script);
});
router.get('/logout', AuthController.logout);

module.exports = router;
