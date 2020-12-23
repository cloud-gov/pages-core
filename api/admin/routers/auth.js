const { Router } = require('express');
const passport = require('../passport');

const onSuccess = (req, res) => {
  const script = `
    <script>
      window.opener.postMessage("success", "*")
    </script>
  `;

  res.send(script);
};

const router = Router();

router.get('/login', passport.authenticate('sso'));
router.get('/logout', passport.logout);

// Callbacks need to be registered with SSO service
router.get('/auth/sso/callback', passport.authenticate('sso'), onSuccess);
router.get('/auth/sso/logout', onSuccess);

module.exports = router;
