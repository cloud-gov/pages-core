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

router.get('/login', passport.authenticate('uaa'));
router.get('/logout', passport.logout);

// Callbacks need to be registered with CF UAA service
router.get('/auth/uaa/callback', passport.authenticate('uaa'), onSuccess);
router.get('/auth/uaa/logout', onSuccess);

module.exports = router;
