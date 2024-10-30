import { expect } from 'chai';
import { spy } from 'sinon';

import { createNotifier } from '../../frontend/middleware';

describe('createNotifier()', () => {
  const testNotificationSettings = {
    TEST_ACTION: {
      type: 'success',
      params: {
        title: 'Success',
        message: 'The test was successful',
        position: 'tr',
        autoDismiss: '5',
      },
    },
  };

  it('dispatches the correct notification when action in settings', () => {
    const notifyMiddleware = createNotifier(testNotificationSettings);
    const fakeNext = spy();
    const fakeStore = {
      dispatch: spy(),
    };
    const fakeAction = {
      type: 'TEST_ACTION',
    };

    // run the middleware function chain
    notifyMiddleware(fakeStore)(fakeNext)(fakeAction);

    expect(fakeStore.dispatch.calledOnce).to.be.true;

    const dispatchedAction = fakeStore.dispatch.getCall(0).args[0];
    const expectedDispatch = Object.assign(
      {},
      {
        type: 'RNS_SHOW_NOTIFICATION',
        level: testNotificationSettings.TEST_ACTION.type,
      },
      testNotificationSettings.params,
    );

    expect(dispatchedAction).to.include(expectedDispatch);
    expect(fakeNext.calledOnce).to.be.true;
    expect(fakeNext.calledWith(fakeAction)).to.be.true;
  });

  it("doesn't dispatch if action not in settings", () => {
    const notifyMiddleware = createNotifier(testNotificationSettings);
    const fakeNext = spy();
    const fakeStore = {
      dispatch: spy(),
    };
    const fakeAction = {
      type: 'ACTION_NOT_IN_SETTINGS',
    };

    // run the middleware function chain
    notifyMiddleware(fakeStore)(fakeNext)(fakeAction);

    expect(fakeStore.dispatch.notCalled).to.be.true;
    expect(fakeNext.calledOnce).to.be.true;
    expect(fakeNext.calledWith(fakeAction)).to.be.true;
  });
});
