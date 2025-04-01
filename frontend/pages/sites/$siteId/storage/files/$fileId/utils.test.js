import { buildFolderLink } from './utils';

describe('$fileId/utils', () => {
  describe('buildFolderLink', () => {
    const siteId = 1;

    it('should build storage folder link with file key in a subfolder', () => {
      const folderName = 'foo';
      const fileName = 'bar.txt';
      const fileKey = `~assets/${folderName}/${fileName}`;
      const linkUrl = `/sites/${siteId}/storage?path=${folderName}`;

      const result = buildFolderLink(fileKey, siteId);
      expect(result.folderUrl).toEqual(linkUrl);
      expect(result.filePath).toEqual(`${folderName}/${fileName}`);
      expect(result.folderName).toEqual(folderName);
    });

    it('should build storage folder link with file key at the assets root', () => {
      const folderName = 'foo';
      const fileKey = `~assets/${folderName}`;
      const linkUrl = `/sites/${siteId}/storage?path=`;

      const result = buildFolderLink(fileKey, siteId);
      expect(result.folderUrl).toEqual(linkUrl);
      expect(result.filePath).toEqual(folderName);
      expect(result.folderName).toEqual('/');
    });
  });
});
