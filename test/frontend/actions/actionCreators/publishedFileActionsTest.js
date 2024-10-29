import { expect } from 'chai';
import {
  publishedFilesFetchStarted,
  publishedFilesFetchStartedType,
  publishedFilesReceived,
  publishedFilesReceivedType,
} from '../../../../frontend/actions/actionCreators/publishedFileActions';

describe('publishedFilesActions actionCreators', () => {
  describe('published files fetch started', () => {
    it('constructs properly', () => {
      const actual = publishedFilesFetchStarted();
      expect(actual).to.deep.equal({
        type: publishedFilesFetchStartedType,
      });
    });

    it('exports its type', () => {
      expect(publishedFilesFetchStartedType).to.equal(
        'SITE_PUBLISHED_FILES_FETCH_STARTED',
      );
    });
  });

  describe('published files received', () => {
    it('constructs properly', () => {
      const files = ['File 1', 'File 2'];

      const actual = publishedFilesReceived(files);

      expect(actual).to.deep.equal({
        type: publishedFilesReceivedType,
        files: files,
      });
    });

    it('exports its type', () => {
      expect(publishedFilesReceivedType).to.equal('SITE_PUBLISHED_FILES_RECEIVED');
    });
  });
});
