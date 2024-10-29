import { expect } from 'chai';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

describe('githubBranchesReducer', () => {
  let fixture;
  const GITHUB_BRANCHES_FETCH_STARTED = '🚦🏎';
  const GITHUB_BRANCHES_RECEIVED = '🛬';
  const GITHUB_BRANCHES_FETCH_ERROR = '⛔️';

  beforeEach(() => {
    fixture = proxyquire('../../../frontend/reducers/githubBranches', {
      '../actions/actionCreators/githubBranchActions': {
        githubBranchesFetchStartedType: GITHUB_BRANCHES_FETCH_STARTED,
        githubBranchesReceivedType: GITHUB_BRANCHES_RECEIVED,
        githubBranchesFetchErrorType: GITHUB_BRANCHES_FETCH_ERROR,
      },
    }).default;
  });

  it('ignores other actions and returns an initial state', () => {
    const BRANCHES = ['🌳', '🌲', '🌴'];

    const actual = fixture(undefined, {
      type: 'wrong type 🙅',
      branches: BRANCHES,
    });

    expect(actual).to.deep.equal({
      isLoading: false,
    });
  });

  it('sets the loading state when a fetch starts', () => {
    const actual = fixture(
      { isLoading: false },
      {
        type: GITHUB_BRANCHES_FETCH_STARTED,
      },
    );

    expect(actual).to.deep.equal({
      isLoading: true,
    });
  });

  it('saves data returned by the fetch', () => {
    const BRANCHES = ['🌳', '🌲', '🌴'];

    const actual = fixture(
      { isLoading: true },
      {
        type: GITHUB_BRANCHES_RECEIVED,
        branches: BRANCHES,
      },
    );

    expect(actual).to.deep.equal({
      isLoading: false,
      data: BRANCHES,
    });
  });

  it('sets the error state when a fetch results in an error', () => {
    const ERROR = '🚨🔥🚨🔥🚨';

    const actual = fixture(
      { isLoading: true },
      {
        type: GITHUB_BRANCHES_FETCH_ERROR,
        error: ERROR,
      },
    );

    expect(actual).to.deep.equal({
      isLoading: false,
      error: ERROR,
    });
  });

  it('resets the state to a loading state when a new fetch starts', () => {
    const actual = fixture(
      {
        isLoading: true,
        data: ['🌳'],
      },
      {
        type: GITHUB_BRANCHES_FETCH_STARTED,
      },
    );

    expect(actual).to.deep.equal({
      isLoading: true,
    });
  });
});
