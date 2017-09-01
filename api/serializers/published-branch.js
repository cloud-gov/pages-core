const serializeObject = (site, name) => ({
  name,
  site: site.toJSON(),
});

const serialize = (site, branch) => {
  if (branch instanceof Array) {
    const array = branch.map(name => serializeObject(site, name));
    return Promise.resolve(array);
  }
  const object = serializeObject(site, branch);
  return Promise.resolve(object);
};

module.exports = { serialize };
