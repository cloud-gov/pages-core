const { Router } = require('express');
const AdminBuildController = require('../controllers/build');
const AdminEventController = require('../controllers/event');
const AdminOrganizationController = require('../controllers/organization');
const AdminRoleController = require('../controllers/role');
const AdminSiteController = require('../controllers/site');
const UserController = require('../controllers/user');
const auth = require('./auth');

const ensureAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.unauthorized();
  }
  return next();
};

const authenticatedRouter = Router();
authenticatedRouter.use(ensureAuthenticated);
authenticatedRouter.get('/builds', AdminBuildController.list);
authenticatedRouter.get('/builds/:id', AdminBuildController.findById);
authenticatedRouter.get('/builds/:id/log', AdminBuildController.findBuildLog);
authenticatedRouter.get('/events', AdminEventController.list);
authenticatedRouter.get('/organizations', AdminOrganizationController.list);
authenticatedRouter.post('/organizations', AdminOrganizationController.create);
authenticatedRouter.get('/organizations/:id', AdminOrganizationController.findById);
authenticatedRouter.put('/organizations/:id', AdminOrganizationController.update);
authenticatedRouter.get('/roles', AdminRoleController.list);
authenticatedRouter.get('/sites', AdminSiteController.list);
authenticatedRouter.get('/sites/:id', AdminSiteController.findById);
authenticatedRouter.put('/sites/:id', AdminSiteController.update);
authenticatedRouter.delete('/sites/:id', AdminSiteController.destroy);
authenticatedRouter.get('/me', UserController.me);
authenticatedRouter.get('/users', UserController.list);
authenticatedRouter.get('/users/:id', UserController.findById);
authenticatedRouter.post('/users/invite', UserController.invite);
authenticatedRouter.post('/users/resend-invite', UserController.resendInvite);

const adminRouter = Router();
adminRouter.use(auth);
adminRouter.use(authenticatedRouter);

module.exports = adminRouter;
