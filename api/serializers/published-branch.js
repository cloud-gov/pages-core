const siteSerializer = require('./site');

const serializeObject = (site, name) => ({
  name,
  site: siteSerializer.toJSON(site),
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
