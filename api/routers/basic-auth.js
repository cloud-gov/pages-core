const router = require('express').Router();
const Controller = require('../controllers/basic-auth');
const sessionAuth = require('../policies/sessionAuth');
const csrfProtection = require('../policies/csrfProtection');

router.use(csrfProtection);

router.get('/site/:site_id/basic-auth', sessionAuth, Controller.find);
router.post('/site/:site_id/basic-auth', sessionAuth, Controller.create);
router.delete('/site/:site_id/basic-auth', sessionAuth, Controller.destroy);
module.exports = router;
