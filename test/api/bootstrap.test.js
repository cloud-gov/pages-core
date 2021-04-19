const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

Promise.props = require('promise-props');

require('./support/aws-mocks');
const cleanDatabase = require('../../api/utils/cleanDatabase');
const { ActionType, Role } = require('../../api/models');
global.Notification = require('../frontend/support/_mockNotification');

before((done) => {
  cleanDatabase()
    .then(() => ActionType.createDefaultActionTypes())
    .then(() => Role.createDefaultRoles())
    .then(() => done())
    .catch(err => done(err));
});
