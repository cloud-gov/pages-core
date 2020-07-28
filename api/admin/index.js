const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const methodOverride = require('method-override');
const session = require('express-session');

const { expressErrorLogger } = require('../../winston');
const responses = require('../responses');

const router = require('./routers');
const passport = require('./passport');
const sessionConfig = require('./sessionConfig');

const { NODE_ENV } = process.env;

function maybeAddCORS(app) {
  if (NODE_ENV === 'development') {
    const corsCfg = {
      origin: 'http://localhost:3000',
      credentials: true,
    };
    app.options('*', cors(corsCfg));
    app.use(cors(corsCfg));
  }
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  res.error(err);
}

const app = express();
maybeAddCORS(app);
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '2mb' }));
app.use(methodOverride());
app.use(responses);
app.use(router);
app.use(expressErrorLogger);
app.use(errorHandler);

module.exports = app;
