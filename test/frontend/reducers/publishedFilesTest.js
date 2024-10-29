import { expect } from 'chai';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

describe('publishedFilesReducer', () => {
  let fixture;
  const PUBLISHED_FILES_FETCH_STARTED = 'published files fetch started';
  const PUBLISHED_FILES_RECEIVED = 'published files received';

  beforeEach(() => {
    fixture = proxyquire('../../../frontend/reducers/publishedFiles', {
      '../actions/actionCreators/publishedFileActions': {
        publishedFilesFetchStartedType: PUBLISHED_FILES_FETCH_STARTED,
        publishedFilesReceivedType: PUBLISHED_FILES_RECEIVED,
      },
    }).default;
  });

  it('ignores other actions and returns an initial state', () => {
    const FILES = ['File 1', 'File 2'];

    const actual = fixture(undefined, {
      files: FILES,
      type: 'the wrong type',
    });

    expect(actual).to.deep.equal({
      isLoading: false,
    });
  });

  it('marks is loading true when a fetch is started', () => {
    const actual = fixture(
      { isLoading: false },
      {
        type: PUBLISHED_FILES_FETCH_STARTED,
      },
    );

    expect(actual).to.deep.equal({
      isLoading: true,
    });
  });

  it('records the files received in the action', () => {
    const FILES = ['File 1', 'File 2'];

    const actual = fixture(
      { isLoading: true },
      {
        type: PUBLISHED_FILES_RECEIVED,
        files: FILES,
      },
    );

    expect(actual).to.deep.equal({
      isLoading: false,
      data: FILES,
    });
  });

  it('overrides the files and marks is loading true when a new fetch starts', () => {
    const actual = fixture(
      {
        isLoading: false,
        data: ['FILE 3'],
      },
      {
        type: PUBLISHED_FILES_FETCH_STARTED,
      },
    );

    expect(actual).to.deep.equal({
      isLoading: true,
    });
  });
});
