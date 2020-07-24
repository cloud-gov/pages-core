const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const methodOverride = require('method-override');
const session = require('express-session');
const sessionConfig = require('../init/sessionConfig');
const { expressLogger, expressErrorLogger } = require('../../winston');
const responses = require('../responses');
const router = require('./routers');
const passport = require('./passport');

const sessionCfg = { ...sessionConfig };
sessionCfg.secret += 'a';
sessionCfg.name = 'federalist-admin.sid';

const app = express();
app.options('*', cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(session(sessionCfg));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '2mb' }));
app.use(methodOverride());
app.use(responses);
app.use(expressLogger);
app.use(router);
app.use(expressErrorLogger);

module.exports = app;
