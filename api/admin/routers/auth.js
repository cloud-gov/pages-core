const { Router } = require('express');
const passport = require('../passport');

const onSuccess = (req, res) => {
  const script = `
    <script nonce="${res.locals.cspNonce}">
      window.opener.postMessage("success", "*")
    </script>
  `;

  res.send(script);
};

const router = Router();

router.get('/login', passport.authenticate('uaa'));
router.get('/auth/github2/callback', passport.authenticate('github'), onSuccess);
router.get('/logout', passport.logout);
router.get('/auth/uaa/callback', passport.authenticate('uaa'), onSuccess);
router.get('/auth/uaa/logout', onSuccess);

module.exports = router;
