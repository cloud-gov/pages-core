const router = require('express').Router();
const Controller = require('../controllers/site-branch-config');
const { csrfProtection, sessionAuth } = require('../middlewares');

router.use(csrfProtection);

router.get('/site/:site_id/branch-config', sessionAuth, Controller.find);
router.post('/site/:site_id/branch-config', sessionAuth, Controller.create);
router.delete('/site/:site_id/branch-config/:id', sessionAuth, Controller.destroy);
router.put('/site/:site_id/branch-config/:id', sessionAuth, Controller.update);
module.exports = router;
