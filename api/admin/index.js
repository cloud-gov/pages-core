const cors = require('cors');
const express = require('express');
const session = require('express-session');

const config = require('../../config');
const { expressErrorLogger } = require('../../winston');

const { cacheControl, errorHandler } = require('../middlewares');
const responses = require('../responses');

const { apiRouter, authRouter } = require('./routers');
const passport = require('./passport');
const sessionConfig = require('./sessionConfig');

const corsCfg = {
  origin: config.app.adminHostname,
  credentials: true,
};

const app = express();
app.use(cors(corsCfg));
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
app.use(cacheControl('no-store'));
app.use(responses);
app.use(authRouter);
app.use(apiRouter);
app.use(expressErrorLogger);
app.use(errorHandler);

module.exports = app;
