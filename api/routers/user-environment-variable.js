const router = require('express').Router();
const Controller = require('../controllers/user-environment-variable');
const { csrfProtection, sessionAuth } = require('../middlewares');

router.use(csrfProtection);

router.get('/site/:site_id/user-environment-variable', sessionAuth, Controller.find);
router.post('/site/:site_id/user-environment-variable', sessionAuth, Controller.create);
router.delete('/site/:site_id/user-environment-variable/:id', sessionAuth, Controller.destroy);
module.exports = router;
