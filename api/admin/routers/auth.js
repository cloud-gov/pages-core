const router = require('express').Router();
const passport = require('../passport');

router.get('/auth/github', passport.authenticate('github'));
router.get('/auth/github/callback', passport.authenticate('github'), (req, res) => {
  const script = `
    <script>
      window.opener.postMessage("success", "http://localhost:3000")
    </script>
  `;

  res.send(script);
});
// router.get('/logout', AdminAuthController.logout);

module.exports = router;
