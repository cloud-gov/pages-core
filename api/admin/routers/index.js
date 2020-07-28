const { Router } = require('express');
const auth = require('./auth');
const AdminBuildController = require('../controllers/build');
const AdminSiteController = require('../controllers/site');
const UserController = require('../controllers/user');

const ensureAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.forbidden({
      message: 'You are not permitted to perform this action.',
    });
  }
  return next();
};

const authenticatedRouter = Router();
authenticatedRouter.use(ensureAuthenticated);
authenticatedRouter.get('/builds', AdminBuildController.findAllBuilds);
authenticatedRouter.get('/sites', AdminSiteController.findAllSites);
authenticatedRouter.get('/me', UserController.me);
authenticatedRouter.get('/logout', (req, res) => {
  req.logout();
  res.json({ status: 'logged out' });
});

const adminRouter = Router();
adminRouter.use(auth);
adminRouter.use(authenticatedRouter);

module.exports = adminRouter;
