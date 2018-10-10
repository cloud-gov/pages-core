Promise.props = require('promise-props');

require('./support/aws-mocks');
const cleanDatabase = require('../../api/utils/cleanDatabase');
const { ActionType } = require('../../api/models');
const Notification = require('./support/mockNotification');

before((done) => {
  cleanDatabase()
    .then(() => ActionType.createDefaultActionTypes())
    .then(() => done())
    .catch(err => done(err));
});
