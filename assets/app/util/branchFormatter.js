import {encodeB64, decodeB64 } from './encoding';

// format draft branch anme

export const formatDraftBranchName = (path) => {
  return `_draft-${encodeB64(path)}`;
}

// determine if a path has a drafts
export const pathHasDraft = (path, drafts) => {
  const draftToFind = formatDraftBranchName(path);
  const hasDraft = drafts.find((draft) => draft.name === draftToFind);
  return !!hasDraft;
}
