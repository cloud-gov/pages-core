import { expect } from 'chai';
import {
  publishedBranchesFetchStarted,
  publishedBranchesFetchStartedType,
  publishedBranchesReceived,
  publishedBranchesReceivedType,
} from '../../../../frontend/actions/actionCreators/publishedBranchActions';

describe('publishedBranchActions actionCreators', () => {
  describe('published branches fetch started', () => {
    it('constructs properly', () => {
      const actual = publishedBranchesFetchStarted();

      expect(actual).to.deep.equal({
        type: publishedBranchesFetchStartedType,
      });
    });

    it('exports its type', () => {
      expect(publishedBranchesFetchStartedType).to.equal(
        'SITE_PUBLISHED_BRANCHES_FETCH_STARTED',
      );
    });
  });

  describe('published branches received', () => {
    it('constructs properly', () => {
      const branches = ['Branch 1', 'Branch 2'];

      const actual = publishedBranchesReceived(branches);

      expect(actual).to.deep.equal({
        type: publishedBranchesReceivedType,
        branches: branches,
      });
    });

    it('exports its type', () => {
      expect(publishedBranchesReceivedType).to.equal('SITE_PUBLISHED_BRANCHES_RECEIVED');
    });
  });
});
