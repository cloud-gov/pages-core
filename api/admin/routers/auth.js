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

router.get('/auth/github', passport.authenticate('github'));
router.get('/auth/github/callback', passport.authenticate('github'), onSuccess);

module.exports = router;
