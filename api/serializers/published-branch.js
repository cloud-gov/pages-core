const serialize = (site, branchNames) => {
  const branches = branchNames.map(name => ({
    name,
    site: site.toJSON(),
    viewLink: site.viewLinkForBranch(name),
  }))
  return Promise.resolve(branches)
}

module.exports = { serialize }
