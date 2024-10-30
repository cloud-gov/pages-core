const expect = require('chai').expect;
const UserActionCreator = require('../../../../api/services/UserActionCreator');
const { ActionType } = require('../../../../api/models');

const actionCreated = (userAction, type, done) => {
  expect(userAction).to.exist;

  return ActionType.findOne({
    where: {
      id: userAction.actionId,
    },
  }).then((action) => {
    expect(action.get('action')).to.equal(type);
    done();
  });
};

describe('UserActionCreator', () => {
  const props = {
    userId: 1,
    targetId: 1,
    targetType: 'user',
    siteId: 1,
  };

  describe('.addRemoveAction', () => {
    it('creates a new UserAction record with a pointer to the remove type', (done) => {
      UserActionCreator.addRemoveAction(props)
        .then((userAction) => actionCreated(userAction, 'remove', done))
        .catch(done);
    });
  });

  describe('.addCreateAction', () => {
    it('creates a new UserAction with a point to the add type', (done) => {
      UserActionCreator.addCreateAction(props)
        .then((userAction) => actionCreated(userAction, 'add', done))
        .catch(done);
    });
  });

  describe('.addUpdateAction', () => {
    it('creates a new UserAction with a point to the update type', (done) => {
      UserActionCreator.addUpdateAction(props)
        .then((userAction) => actionCreated(userAction, 'update', done))
        .catch(done);
    });
  });
});
