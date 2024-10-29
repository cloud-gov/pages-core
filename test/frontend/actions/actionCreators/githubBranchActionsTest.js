import { expect } from 'chai';
import {
  githubBranchesFetchStarted,
  githubBranchesFetchStartedType,
  githubBranchesReceived,
  githubBranchesReceivedType,
  githubBranchesFetchError,
  githubBranchesFetchErrorType,
} from '../../../../frontend/actions/actionCreators/githubBranchActions';

describe('githubBranchActions actionCreators', () => {
  describe('github branches fetch started', () => {
    it('constructs properly', () => {
      const actual = githubBranchesFetchStarted();
      expect(actual).to.deep.equal({
        type: githubBranchesFetchStartedType,
      });
    });

    it('exports its type', () => {
      expect(githubBranchesFetchStartedType).to.equal(
        'SITE_GITHUB_BRANCHES_FETCH_STARTED',
      );
    });
  });

  describe('github branches received', () => {
    it('constructs properly', () => {
      const BRANCHES = ['🌳', '🌲', '🌴'];

      const actual = githubBranchesReceived(BRANCHES);

      expect(actual).to.deep.equal({
        type: githubBranchesReceivedType,
        branches: BRANCHES,
      });
    });

    it('exports its type', () => {
      expect(githubBranchesReceivedType).to.equal('SITE_GITHUB_BRANCHES_RECEIVED');
    });
  });

  describe('github branches fetch error', () => {
    it('constructs properly', () => {
      const ERROR = new Error('🔥 everything is broken 🔥');

      const actual = githubBranchesFetchError(ERROR);

      expect(actual).to.deep.equal({
        type: githubBranchesFetchErrorType,
        error: ERROR,
      });
    });

    it('exports its type', () => {
      expect(githubBranchesFetchErrorType).to.equal('SITE_GITHUB_BRANCHES_FETCH_ERROR');
    });
  });
});
