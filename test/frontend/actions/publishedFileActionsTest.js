import { expect } from 'chai';
import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

describe('publishedFileActions', () => {
  let fixture;
  let dispatch;
  let publishedFilesFetchStartedActionCreator;
  let publishedFilesReceivedActionCreator;
  let fetchPublishedFiles;

  beforeEach(() => {
    dispatch = spy();
    publishedFilesFetchStartedActionCreator = stub();
    publishedFilesReceivedActionCreator = stub();

    fetchPublishedFiles = stub();

    fixture = proxyquire('../../../frontend/actions/publishedFileActions', {
      './actionCreators/publishedFileActions': {
        publishedFilesFetchStarted: publishedFilesFetchStartedActionCreator,
        publishedFilesReceived: publishedFilesReceivedActionCreator,
      },
      '../util/federalistApi': {
        fetchPublishedFiles,
      },
      '../store': {
        dispatch,
      },
    }).default;
  });

  it('fetchPublishedFiles', (done) => {
    const response = {
      isTruncated: false,
      files: ['File 1', 'File 2'],
    };
    const publishedFilesPromise = Promise.resolve(response);
    const startedAction = {
      action: 'started',
    };
    const receivedAction = {
      action: 'received',
    };
    fetchPublishedFiles.withArgs().returns(publishedFilesPromise);
    publishedFilesFetchStartedActionCreator.withArgs().returns(startedAction);
    publishedFilesReceivedActionCreator.withArgs(response).returns(receivedAction);

    const actual = fixture.fetchPublishedFiles();

    actual.then(() => {
      expect(dispatch.calledTwice).to.be.true;
      expect(dispatch.calledWith(startedAction)).to.be.true;
      expect(dispatch.calledWith(receivedAction)).to.be.true;
      done();
    });
  });
});
