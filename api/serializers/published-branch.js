const serialize = (site, branch, files) => {
  if (branch instanceof Array) {
    const array = branch.map(name => serializeObject(site, name))
    return Promise.resolve(array)
  } else {
    const object = serializeObject(site, branch, files)
    return Promise.resolve(object)
  }
}

const serializeObject = (site, name, files) => {
  const object = {
    name,
    site: site.toJSON(),
    viewLink: site.viewLinkForBranch(name),
  }
  if (files) {
    object.files = files
  }
  return object
}

module.exports = { serialize }
