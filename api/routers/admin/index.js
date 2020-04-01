const adminRouter = require('express').Router();
const adminSessionAuth = require('../../policies/adminSessionAuth');

adminRouter.get('/', adminSessionAuth, (req, res) => res.json({
  message: 'Hello World',
}));

module.exports = adminRouter;
