const router = require('express').Router();
const DomainController = require('../controllers/domain');
const { csrfProtection, sessionAuth } = require('../middlewares');

router.use(sessionAuth);
router.use(csrfProtection);

router.post('/site/:site_id/domain', DomainController.create);
router.put('/site/:site_id/domain/:domain_id', DomainController.update);
router.delete('/site/:site_id/domain/:domain_id', DomainController.delete);

module.exports = router;
