import {encodeB64, decodeB64 } from './encoding';

// format draft branch anme
export const formatDraftBranchName = (path) => {
  return `_draft-${encodeB64(path)}`;
}

// determine if a path has a draft
export const pathHasDraft = (path, branches) => {
  return !!getDraft(path, branches);
}

export const getDraft = (path, branches) => {
  const draftToFind = formatDraftBranchName(path);
  return branches.find((draft) => draft.name === draftToFind);
}
