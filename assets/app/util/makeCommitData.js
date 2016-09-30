import { encodeB64 } from './encoding';

const addPathToSite = (site, path, fileContent, message, sha) => {
  const b64EncodedFileContents = encodeB64(fileContent);
  let commit = {
    path,
    message: (message) ? message : `Adds ${path} to project`,
    content: b64EncodedFileContents,
    branch: `${site.branch || site.defaultBranch}`
  };
  
  if (sha) commit = Object.assign({}, commit, { sha });
  
  return commit;
};

const uploadFileToSite = (filename, fileContent, sha) => {
  const message = `Uploads ${filename} to project`;
  let commit = {
    content: fileContent,
    message: message
  };
  
  if (sha) commit = Object.assign({}, commit, { sha });

  return commit;
};

export { addPathToSite, uploadFileToSite };
