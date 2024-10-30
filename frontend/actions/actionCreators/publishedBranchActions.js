const publishedBranchesFetchStartedType = 'SITE_PUBLISHED_BRANCHES_FETCH_STARTED';
const publishedBranchesReceivedType = 'SITE_PUBLISHED_BRANCHES_RECEIVED';

const publishedBranchesFetchStarted = () => ({
  type: publishedBranchesFetchStartedType,
});

const publishedBranchesReceived = (branches) => ({
  type: publishedBranchesReceivedType,
  branches,
});

export {
  publishedBranchesFetchStartedType,
  publishedBranchesFetchStarted,
  publishedBranchesReceivedType,
  publishedBranchesReceived,
};
