const publishedBranchesReceivedType = "SITE_PUBLISHED_BRANCHES_RECEIVED";

const publishedBranchesReceived = branches => ({
  type: publishedBranchesReceivedType,
  branches,
});

export {
  publishedBranchesReceivedType, publishedBranchesReceived,
}
