const serialize = (site, branch) => {
  if (branch instanceof Array) {
    const array = branch.map(name => serializeObject(site, name))
    return Promise.resolve(array)
  } else {
    const object = serializeObject(site, branch)
    return Promise.resolve(object)
  }
}

const serializeObject = (site, name) => {
  return {
    name,
    site: site.toJSON(),
    viewLink: site.viewLinkForBranch(name),
  }
}

module.exports = { serialize }
