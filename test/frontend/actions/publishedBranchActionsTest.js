import { expect } from 'chai';
import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

describe('publishedBranchActions', () => {
  let fixture;
  let dispatch;
  let publishedBranchesFetchStartedActionCreator;
  let publishedBranchesReceivedActionCreator;
  let fetchPublishedBranches;

  beforeEach(() => {
    dispatch = spy();
    publishedBranchesFetchStartedActionCreator = stub();
    publishedBranchesReceivedActionCreator = stub();

    fetchPublishedBranches = stub();

    fixture = proxyquire('../../../frontend/actions/publishedBranchActions', {
      './actionCreators/publishedBranchActions': {
        publishedBranchesFetchStarted: publishedBranchesFetchStartedActionCreator,
        publishedBranchesReceived: publishedBranchesReceivedActionCreator,
      },
      '../util/federalistApi': {
        fetchPublishedBranches: fetchPublishedBranches,
      },
      '../store': {
        dispatch: dispatch,
      },
    }).default;
  });

  it('fetchPublishedBranches', (done) => {
    const branches = ['Branch 1', 'Branch 2'];
    const publishedBranchesPromise = Promise.resolve(branches);
    const startedAction = {
      action: '🚦🏎',
    };
    const receivedAction = {
      action: '🏁',
    };
    fetchPublishedBranches.withArgs().returns(publishedBranchesPromise);
    publishedBranchesFetchStartedActionCreator.withArgs().returns(startedAction);
    publishedBranchesReceivedActionCreator.withArgs(branches).returns(receivedAction);

    const actual = fixture.fetchPublishedBranches();

    actual.then(() => {
      expect(dispatch.calledTwice).to.be.true;
      expect(dispatch.calledWith(startedAction)).to.be.true;
      expect(dispatch.calledWith(receivedAction)).to.be.true;
      done();
    });
  });
});
