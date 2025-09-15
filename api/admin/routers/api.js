const { Router } = require('express');

const config = require('../../../config');

const {
  csrfProtection,
  ensureAuthenticated,
  ensureOrigin,
  parseJson,
  authorize,
} = require('../../middlewares');

const AdminControllers = require('../controllers');

const apiRouter = Router();
apiRouter.use(ensureOrigin(config.app.adminHostname));
apiRouter.use(ensureAuthenticated);
apiRouter.use(csrfProtection);
apiRouter.use(parseJson);
apiRouter.get('/builds', AdminControllers.Build.list);
apiRouter.get('/builds/:id', AdminControllers.Build.findById);
apiRouter.get('/builds/:id/log', AdminControllers.Build.findBuildLog);
apiRouter.post('/builds', AdminControllers.Build.rebuild);
apiRouter.put('/builds/:id', AdminControllers.Build.update);
apiRouter.get('/domains', AdminControllers.Domain.list);
apiRouter.get('/domains/:id', AdminControllers.Domain.findById);
apiRouter.delete(
  '/domains/:id',
  authorize(['pages.admin']),
  AdminControllers.Domain.destroy,
);
apiRouter.get('/domains/:id/dns', AdminControllers.Domain.dns);
apiRouter.get('/domains/:id/dns-result', AdminControllers.Domain.dnsResult);
apiRouter.post(
  '/domains/:id/destroy',
  authorize(['pages.admin']),
  AdminControllers.Domain.destroy,
);
apiRouter.post(
  '/domains/:id/deprovision',
  authorize(['pages.admin']),
  AdminControllers.Domain.deprovision,
);
apiRouter.post('/domains/:id/provision', AdminControllers.Domain.provision);
apiRouter.post('/domains', AdminControllers.Domain.create);
apiRouter.get('/events', AdminControllers.Event.list);
apiRouter.get('/organizations', AdminControllers.Organization.list);
apiRouter.post('/organizations', AdminControllers.Organization.create);
apiRouter.get('/organizations/:id', AdminControllers.Organization.findById);
apiRouter.put('/organizations/:id', AdminControllers.Organization.update);
apiRouter.post(
  '/organizations/:id/deactivate',
  authorize(['pages.admin']),
  AdminControllers.Organization.deactivate,
);
apiRouter.post('/organizations/:id/activate', AdminControllers.Organization.activate);
apiRouter.delete(
  '/organization/:org_id/user/:user_id',
  authorize(['pages.admin']),
  AdminControllers.OrganizationRole.destroy,
);
apiRouter.get('/reports/organizations', AdminControllers.Organization.listOrdered);
apiRouter.get('/reports/organizations.csv', AdminControllers.Organization.listOrderedCSV);
apiRouter.get('/reports/published-sites', AdminControllers.Domain.listPublished);
apiRouter.get('/reports/published-sites.csv', AdminControllers.Domain.listPublishedCSV);
apiRouter.get('/reports/users', AdminControllers.User.listForUsersReport);
apiRouter.get('/reports/users.csv', AdminControllers.User.listForUsersReportCSV);
apiRouter.get('/reports/active-users', AdminControllers.User.listForActiveUsersReport);
apiRouter.get(
  '/reports/active-users.csv',
  AdminControllers.User.listForActiveUsersReportCSV,
);
apiRouter.put('/organization-role', AdminControllers.OrganizationRole.update);
apiRouter.get('/roles', AdminControllers.Role.list);
apiRouter.get('/sites', AdminControllers.Site.list);
apiRouter.get('/sites/raw', AdminControllers.Site.listRaw);
apiRouter.get('/sites/:id', AdminControllers.Site.findById);
apiRouter.put('/sites/:id', AdminControllers.Site.update);
apiRouter.post(
  '/sites/:id/file-storage',
  AdminControllers.FileStorage.createSiteFileStorage,
);
apiRouter.get('/sites/:id/file-storage', AdminControllers.FileStorage.getSiteFileStorage);
apiRouter.get(
  '/site-file-storage/:id/user-actions',
  AdminControllers.FileStorage.getSiteFileStorageUserActions,
);
apiRouter.get('/sites/:id/webhooks', AdminControllers.Site.listWebhooks);
apiRouter.post('/sites/:id/webhooks', AdminControllers.Site.createWebhook);
apiRouter.delete('/sites/:id', authorize(['pages.admin']), AdminControllers.Site.destroy);
apiRouter.post('/sites/:id/tasks', AdminControllers.Task.addSiteBuildTask);
apiRouter.get('/tasks', AdminControllers.Task.list);
apiRouter.get('/tasks/types', AdminControllers.Task.listTypes);
apiRouter.delete(
  '/site-build-tasks/:id',
  authorize(['pages.admin']),
  AdminControllers.Task.removeSiteBuiltTask,
);
apiRouter.put('/site-build-tasks/:id', AdminControllers.Task.updateSiteBuildTask);
apiRouter.get('/me', AdminControllers.User.me);
apiRouter.get(
  '/user-environment-variables',
  AdminControllers.UserEnvironmentVariable.list,
);
apiRouter.get('/users', AdminControllers.User.list);
apiRouter.get('/users/:id', AdminControllers.User.findById);
apiRouter.post('/users/invite', AdminControllers.User.invite);
apiRouter.post('/users/resend-invite', AdminControllers.User.resendInvite);

module.exports = apiRouter;
