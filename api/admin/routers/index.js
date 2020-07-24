const { Router } = require('express');
const auth = require('./auth');
const build = require('./build');
const site = require('./site');
const user = require('./user');

const ensureAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    res.forbidden({
      message: 'You are not permitted to perform this action.',
    });
  }
  next();
};

const adminRouter = Router();
adminRouter.get('/', (req, res) => res.json({
  message: 'Hello World',
}));
adminRouter.use(auth);
adminRouter.use(ensureAuthenticated, build);
adminRouter.use(ensureAuthenticated, site);
adminRouter.use(ensureAuthenticated, user);

module.exports = adminRouter;
