const router = require('express').Router();
const OrganizationRoleController = require('../controllers/organization-role');
const { csrfProtection, sessionAuth } = require('../middlewares');

router.use(sessionAuth);
router.use(csrfProtection);

router.get('/organization-role', OrganizationRoleController.findAllForUser);
// for reasons that aren't totally clear, this method doesn't receive a request
// body when running normally but the test requests do pass the body properly
// router.delete('/organization-role', OrganizationRoleController.destroy);
// in response, we moved this to a more REST-ful, path-based DELETE in /organization
router.put('/organization-role', OrganizationRoleController.update);

module.exports = router;
