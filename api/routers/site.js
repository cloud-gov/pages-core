const router = require('express').Router();
const SiteController = require('../controllers/site');
const { csrfProtection, sessionAuth } = require('../middlewares');

// enable csrf protection for all site routes
// note that this must come before the route definitions
router.use(csrfProtection);

router.get('/site', sessionAuth, SiteController.findAllForUser);
router.post('/site', sessionAuth, SiteController.create);
router.get('/site/:id', sessionAuth, SiteController.findById);
router.put('/site/:id', sessionAuth, SiteController.update);
router.delete('/site/:id', sessionAuth, SiteController.destroy);
router.get('/site/:site_id/domains', sessionAuth, SiteController.getSiteDomains);
router.get('/site/:site_id/task', sessionAuth, SiteController.getSiteBuildTasks);
router.put(
  '/site/:site_id/task/:task_id',
  sessionAuth,
  SiteController.updateSiteBuildTask,
);
router.get('/site/:site_id/tasks', sessionAuth, SiteController.getSiteTasks);
module.exports = router;
