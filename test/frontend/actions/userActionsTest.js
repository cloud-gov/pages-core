import { expect } from 'chai';
import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

describe('userActions', () => {
  let fixture;
  let dispatch;
  let userFetchStartedActionCreator;
  let userReceivedActionCreator;
  let createUserActionFetchStarted;
  let createUserActionReceived;
  let fetchUser;
  let fetchUserActions;

  beforeEach(() => {
    dispatch = spy();

    userFetchStartedActionCreator = stub();
    userReceivedActionCreator = stub();
    fetchUser = stub();

    createUserActionFetchStarted = stub();
    createUserActionReceived = stub();
    fetchUserActions = stub();

    fixture = proxyquire('../../../frontend/actions/userActions', {
      './actionCreators/userActions': {
        userFetchStarted: userFetchStartedActionCreator,
        userReceived: userReceivedActionCreator,
        userActionFetchStarted: createUserActionFetchStarted,
        userActionReceived: createUserActionReceived,
      },
      '../util/federalistApi': {
        fetchUser,
        fetchUserActions,
      },
      '../store': {
        dispatch,
      },
    }).default;
  });

  describe('fetchUser', () => {
    it('fetches the user and dispatches a user received action when successful', () => {
      const user = {
        uid: 'user id',
        name: 'no thanks',
        favoritePancake: 'buttermilk',
      };
      const userPromise = Promise.resolve(user);
      const fetchStartedAction = { action: 'started' };
      const receivedAction = { action: 'received' };
      fetchUser.withArgs().returns(userPromise);
      userFetchStartedActionCreator.withArgs().returns(fetchStartedAction);
      userReceivedActionCreator.withArgs(user).returns(receivedAction);

      const actual = fixture.fetchUser();

      actual.then(() => {
        expect(dispatch.calledTwice).to.be.true;
        expect(dispatch.calledWith(fetchStartedAction)).to.be.true;
        expect(dispatch.calledWith(receivedAction)).to.be.true;
      });
    });

    it('does nothing when fetching the user fails', () => {
      const rejectedPromise = Promise.reject('ignored');
      fetchUser.withArgs().returns(rejectedPromise);

      const actual = fixture.fetchUser();

      actual.then(() => {
        expect(dispatch.called).to.be.false;
        expect(userReceivedActionCreator.called).to.be.false;
      });
    });
  });

  describe('fetchUserActions', () => {
    const siteId = 1;
    let actual;

    beforeEach(() => {
      fetchUserActions.withArgs(siteId).returns(Promise.resolve());
      actual = fixture.fetchUserActions(siteId);
    });

    it('dispatches a userActionFetchStarted action', () => {
      actual.then(() => {
        expect(dispatch.calledTwice).to.be.true;
      });
    });

    it('calls the corresponding federalist api method', () => {
      actual.then(() =>
        expect(fetchUserActions.calledWith(siteId)).to.be.true
      );
    });

    it('dispatches a userActionReceived actionwhen complete', () => {
      actual.then(() =>
        expect(dispatch.called).to.be.true
      );
    });
  });
});
