const crypto = require('crypto');
const router = require('express').Router();

router.post('/oauth/token', (req, res) => res.send({
  access_token: crypto.randomUUID(),
}));

module.exports = router;
