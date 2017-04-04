const publishedBranchReceivedType = "SITE_PUBLISHED_BRANCH_RECEIVED"
const publishedBranchesReceivedType = "SITE_PUBLISHED_BRANCHES_RECEIVED"

const publishedBranchReceived = branch => ({
  type: publishedBranchReceivedType,
  branch,
})

const publishedBranchesReceived = branches => ({
  type: publishedBranchesReceivedType,
  branches,
});

export {
  publishedBranchReceivedType, publishedBranchReceived,
  publishedBranchesReceivedType, publishedBranchesReceived,
}
