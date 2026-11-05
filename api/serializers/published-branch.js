const siteSerializer = require('./site');

const serializeObject = (site, name) => ({
  name,
  site: siteSerializer.toJSON(site),
});

/**
 * @param {Object} site - The site the branches belong to
 * @param {string|string[]} branch - A branch name or a list of branch names
 * @returns {Promise<Object|Object[]>} The serialized branch, or a list of them
 */
const serialize = (site, branch) => {
  if (branch instanceof Array) {
    const array = branch.map((name) => serializeObject(site, name));
    return Promise.resolve(array);
  }
  const object = serializeObject(site, branch);
  return Promise.resolve(object);
};

module.exports = {
  serialize,
};
