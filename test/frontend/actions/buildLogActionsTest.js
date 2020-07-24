import { expect } from 'chai';
import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

describe('buildActions', () => {
  let fixture;
  let dispatch;
  let buildLogsFetchStartedActionCreator;
  let buildLogsReceivedActionCreator;
  let fetchBuildLogs;

  beforeEach(() => {
    dispatch = spy();
    buildLogsFetchStartedActionCreator = stub();
    buildLogsReceivedActionCreator = stub();

    fetchBuildLogs = stub();

    fixture = proxyquire('../../../frontend/actions/buildLogActions', {
      './actionCreators/buildLogActions': {
        buildLogsFetchStarted: buildLogsFetchStartedActionCreator,
        buildLogsReceived: buildLogsReceivedActionCreator,
      },
      '../util/federalistApi': {
        fetchBuildLogs,
      },
      '../store': {
        dispatch,
      },
    }).default;
  });

  it('fetchBuildLogs', () => {
    const logs = ['Log 1', 'Log 2'];
    const buildLogsPromise = Promise.resolve(logs);
    const fetchStartedAction = { action: 'fetchStarted' };
    const receivedAction = { action: 'received' };
    fetchBuildLogs.withArgs().onCall(0).returns(buildLogsPromise);
    fetchBuildLogs.withArgs().onCall(1).returns(Promise.resolve([]));
    buildLogsFetchStartedActionCreator.withArgs().returns(fetchStartedAction);
    buildLogsReceivedActionCreator.withArgs(logs).returns(receivedAction);
    buildLogsReceivedActionCreator.withArgs([]).returns(receivedAction);

    const actual = fixture.fetchBuildLogs();

    return actual.then(() => {
      expect(dispatch.calledThrice).to.be.true;
      expect(dispatch.firstCall.calledWith(fetchStartedAction)).to.be.true;
      expect(dispatch.secondCall.calledWith(receivedAction)).to.be.true;
      expect(dispatch.thirdCall.calledWith(receivedAction)).to.be.true;
    });
  });
});
