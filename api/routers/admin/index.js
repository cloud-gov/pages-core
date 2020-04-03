const { Router } = require('express');
const adminSessionAuth = require('../../policies/adminSessionAuth');

const adminRouter = Router();
adminRouter.get('/', adminSessionAuth, (req, res) => res.json({
  message: 'Hello World',
}));
adminRouter.use(require('./build'));
adminRouter.use(require('./site'));

module.exports = adminRouter;
