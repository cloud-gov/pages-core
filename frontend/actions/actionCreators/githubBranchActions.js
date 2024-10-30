const githubBranchesFetchStartedType = 'SITE_GITHUB_BRANCHES_FETCH_STARTED';
const githubBranchesReceivedType = 'SITE_GITHUB_BRANCHES_RECEIVED';
const githubBranchesFetchErrorType = 'SITE_GITHUB_BRANCHES_FETCH_ERROR';

const githubBranchesFetchStarted = () => ({
  type: githubBranchesFetchStartedType,
});

const githubBranchesReceived = (branches) => ({
  type: githubBranchesReceivedType,
  branches,
});

const githubBranchesFetchError = (error) => ({
  type: githubBranchesFetchErrorType,
  error,
});

export {
  githubBranchesFetchStartedType,
  githubBranchesFetchStarted,
  githubBranchesReceivedType,
  githubBranchesReceived,
  githubBranchesFetchErrorType,
  githubBranchesFetchError,
};
