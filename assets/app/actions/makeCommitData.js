import { encodeB64 } from '../util/encoding';

const addPathToSite = (site, path, fileData, message, sha) => {
  const b64EncodedFileContents = encodeB64(fileData);
  let commit = {
    path,
    message: (message) ? message : `Adds ${path} to project`,
    content: b64EncodedFileContents,
    branch: `${site.branch || site.defaultBranch}`
  };
  
  if (sha) commit = Object.assign({}, commit, { sha });
  
  return commit;
};

export { addPathToSite };
