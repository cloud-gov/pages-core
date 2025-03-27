export function buildFolderLink(fileKey, siteId) {
  const query = new URLSearchParams();
  const nodes = fileKey.split('/').filter((x) => {
    if (x === '~assets') return false;

    return x;
  });

  const dirs = nodes.slice(0, -1);
  const folderName = dirs[dirs.length - 1] || '/';
  query.set('path', dirs.join('/'));
  const folderUrl = `/sites/${siteId}/storage?${query.toString()}`;

  return {
    folderName,
    folderUrl,
    filePath: nodes.join('/'),
  };
}
