const { Router } = require('express');

const config = require('../../../config');

const {
  csrfProtection, ensureAuthenticated, ensureOrigin, parseJson,
} = require('../../middlewares');

const AdminControllers = require('../controllers');

const apiRouter = Router();
apiRouter.use(ensureOrigin(config.app.adminHostname));
apiRouter.use(ensureAuthenticated);
apiRouter.use(csrfProtection);
apiRouter.get('/builds', AdminControllers.Build.list);
apiRouter.get('/builds/:id', AdminControllers.Build.findById);
apiRouter.get('/builds/:id/log', AdminControllers.Build.findBuildLog);
apiRouter.put('/builds/:id', parseJson, AdminControllers.Build.update);
apiRouter.get('/domains', AdminControllers.Domain.list);
apiRouter.get('/domains/:id', AdminControllers.Domain.findById);
apiRouter.get('/domains/:id/dns', AdminControllers.Domain.dns);
apiRouter.get('/domains/:id/dns-result', AdminControllers.Domain.dnsResult);
apiRouter.post('/domains/:id/provision', AdminControllers.Domain.provision);
apiRouter.post('/domains', parseJson, AdminControllers.Domain.create);
apiRouter.get('/events', AdminControllers.Event.list);
apiRouter.get('/organizations', AdminControllers.Organization.list);
apiRouter.post('/organizations', parseJson, AdminControllers.Organization.create);
apiRouter.get('/organizations/:id', AdminControllers.Organization.findById);
apiRouter.put('/organizations/:id', parseJson, AdminControllers.Organization.update);
apiRouter.delete('/organization-role', parseJson, AdminControllers.OrganizationRole.destroy);
apiRouter.put('/organization-role', parseJson, AdminControllers.OrganizationRole.update);
apiRouter.get('/roles', AdminControllers.Role.list);
apiRouter.get('/sites', AdminControllers.Site.list);
apiRouter.get('/sites/:id', AdminControllers.Site.findById);
apiRouter.put('/sites/:id', parseJson, AdminControllers.Site.update);
apiRouter.delete('/sites/:id', AdminControllers.Site.destroy);
apiRouter.get('/me', AdminControllers.User.me);
apiRouter.get('/user-environment-variables', AdminControllers.UserEnvironmentVariable.list);
apiRouter.get('/users', AdminControllers.User.list);
apiRouter.get('/users/:id', AdminControllers.User.findById);
apiRouter.post('/users/invite', parseJson, AdminControllers.User.invite);
apiRouter.post('/users/resend-invite', parseJson, AdminControllers.User.resendInvite);

module.exports = apiRouter;
