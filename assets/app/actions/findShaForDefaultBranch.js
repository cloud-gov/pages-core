export default site => {
  return site.branches.find(branch => {
    return branch.name === site.defaultBranch;
  }).commit.sha;
};
