const express = require('express');
const csurf = require('csurf');

const csrfProtection = csurf();
const mainRouter = express.Router();

mainRouter.use(require('./auth'));
mainRouter.use(require('./preview'));
mainRouter.use(require('./webhook'));

// add csrfProtection to main so that we can add it to
// the response context in the main.js controller
mainRouter.use(csrfProtection, require('./main'));

const apiRouter = express.Router();
apiRouter.use(require('./build-log'));
apiRouter.use(require('./build'));
apiRouter.use(require('./published-branch'));
apiRouter.use(require('./site'));
apiRouter.use(require('./user'));
apiRouter.use(require('./published-file'));

// prefix all api routes with "/v0" and add csrf protection
mainRouter.use('/v0', csrfProtection, apiRouter);

module.exports = mainRouter;
