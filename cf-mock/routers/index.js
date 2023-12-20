const express = require('express');

const apiRouter = express.Router();
const mainRouter = express.Router();

apiRouter.use(require('./service-credential-binding'));
// apiRouter.use(require('./build-task'));
// apiRouter.use(require('./build'));

mainRouter.use('/v3', apiRouter);

module.exports = mainRouter;
