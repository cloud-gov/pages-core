const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const methodOverride = require('method-override');
const session = require('express-session');

const sessionConfig = require('../init/sessionConfig');
const { expressErrorLogger } = require('../../winston');
const responses = require('../responses');

const router = require('./routers');
const passport = require('./passport');

const { NODE_ENV } = process.env;

const sessionCfg = {
  ...sessionConfig,
  name: 'federalist-admin.sid',
  secret: `${sessionConfig.secret}a`, // TODO
};

const maybeAddCORS = (app) => {
  if (NODE_ENV === 'development') {
    const corsCfg = {
      origin: 'http://localhost:3000',
      credentials: true,
    };
    app.options('*', cors(corsCfg));
    app.use(cors(corsCfg));
  }
};

const app = express();
maybeAddCORS(app);
app.use(session(sessionCfg));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '2mb' }));
app.use(methodOverride());
app.use(responses);
app.use(router);
app.use(expressErrorLogger);

module.exports = app;
