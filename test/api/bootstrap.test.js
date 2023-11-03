const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

Promise.props = require('promise-props');

const cleanDatabase = require('../../api/utils/cleanDatabase');
const { ActionType, Role } = require('../../api/models');
global.Notification = require('../frontend/support/_mockNotification');

before(() => cleanDatabase()
  .then(() => ActionType.createDefaultActionTypes())
  .then(() => Role.createDefaultRoles()));
