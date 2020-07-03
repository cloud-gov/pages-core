const { wrapHandlers } = require('../utils');
const {
  ValidationError,
  validBasicAuthUsername,
  validBasicAuthPassword
} = require('../utils/validators');
const { Site } = require('../models');
const siteSerializer = require('../serializers/site');

function stripCredentials({ username, password }) {
  if (validBasicAuthUsername(username) && validBasicAuthPassword(password)) {
    return { username, password };
  }

  throw new ValidationError('username or password is not valid.');
}

function hideCredentials({ username, password }) {
  if (username && username.length && password && password.length) {
    return { username, password: '**********' };
  }
  return {};
}

module.exports = wrapHandlers({
  async find(req, res) {
    const { params, user } = req;
    const { site_id: siteId } = params;

    const site = await Site.forUser(user).findByPk(siteId);

    if (!site) {
      return res.notFound();
    }
console.log(`\n\nfind basic-auth site:\t${JSON.stringify(site)}\n\n`)
    const credentials = hideCredentials(site.basicAuth);

    return res.ok(credentials);
  },

  async create(req, res) {
    const { body, params, user } = req;
    const { site_id: siteId } = params;

    let site = await Site.forUser(user).findByPk(siteId);

    if (!site) {
      return res.notFound();
    }

    const credentials = stripCredentials(body);
    
    const config = site.config;
    config.basicAuth = credentials;
    site = await site.update({ config });
    // site = await site.reload();
console.log(`\n\ncreate basic-auth site:\t${JSON.stringify(site)}\n\n`)
    const hiddenCredentials = hideCredentials(site.basicAuth);
    return res.ok(hiddenCredentials);
  },

  async destroy(req, res) {
    const { params, user } = req;
    const { site_id: siteId } = params;

    let site = await Site.forUser(user).findByPk(siteId);

    if (!site) {
      return res.notFound();
    }

    const config = site.config;
    delete config.basicAuth;
    site = await site.update({ config });
console.log(`\n\ndestroy basic-auth site:\t${JSON.stringify(site)}\n\n`)
    const hiddenCredentials = hideCredentials(site.basicAuth);
    return res.ok(hiddenCredentials);
  },
});
