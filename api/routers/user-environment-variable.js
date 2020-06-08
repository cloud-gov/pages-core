const router = require('express').Router();
const Controller = require('../controllers/user-environment-variable');
const sessionAuth = require('../policies/sessionAuth');
const csrfProtection = require('../policies/csrfProtection');

router.use(csrfProtection);

router.get('/site/:site_id/user-environment-variable', sessionAuth, Controller.find);
router.post('/site/:site_id/user-environment-variable', sessionAuth, Controller.create);
router.delete('/site/:site_id/user-environment-variable/:id', sessionAuth, Controller.destroy);
module.exports = router;
