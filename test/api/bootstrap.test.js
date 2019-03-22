Promise.props = require('promise-props');

require('./support/aws-mocks');
const cleanDatabase = require('../../api/utils/cleanDatabase');
const { ActionType } = require('../../api/models');
global.Notification = require('../frontend/support/_mockNotification');

before((done) => {
  cleanDatabase()
    .then(() => ActionType.createDefaultActionTypes())
    .then(() => done())
    .catch(err => done(err));
});

// Cloud Foundry API
process.env.CLOUD_FOUNDRY_API_HOST = 'https://api.example.com';
process.env.BUILD_SPACE_GUID = '123abc-456def-789ghi';

// Cloud Foundry Auth
process.env.CLOUD_FOUNDRY_OAUTH_TOKEN_URL = 'https://login.example.com/oauth/token';
process.env.DEPLOY_USER_USERNAME = 'deploy_user';
process.env.DEPLOY_USER_PASSWORD = 'deploy_pass';
process.env.SERVICE_KEY_CREATED = new Date(new Date() - (1 * 24 * 60 * 60 * 1000));
