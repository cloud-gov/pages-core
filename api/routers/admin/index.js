const { Router } = require('express');
const cors = require('cors');
const adminSessionAuth = require('../../policies/adminSessionAuth');

const adminRouter = Router();
adminRouter.use(cors({ origin: 'http://localhost:3000' }));
adminRouter.get('/', adminSessionAuth, (req, res) => res.json({
  message: 'Hello World',
}));
adminRouter.use(require('./auth'));
adminRouter.use(require('./build'));
adminRouter.use(require('./site'));

module.exports = adminRouter;
