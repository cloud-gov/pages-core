const config = require('../../config');

const { proxyDomain } = config.app;

function path(site, deployment) {
  return `/${deployment}/${site.owner}/${site.repository}`;
}

function siteViewOrigin(site) {
  return `${site.awsBucketName}.${proxyDomain}`;
}

function siteViewDomain(site) {
  return `https://${siteViewOrigin(site)}`;
}

function siteViewLink(site, deployment = 'site') {
  let link;
  if (deployment === 'site' && site.domain) {
    link = site.domain;
  } else if (deployment === 'demo' && site.demoDomain) {
    link = site.demoDomain;
  } else {
    link = `${siteViewDomain(site)}${path(site, deployment)}`;
  }
  return `${link.replace(/\/+$/, '')}/`;
}

const hideBasicAuthPassword = ({ username, password }) => {
  if (password && password.length) {
    return {
      username,
      password: '**********',
    };
  }
  return {};
};

module.exports = {
  path,
  siteViewLink,
  siteViewDomain,
  siteViewOrigin,
  hideBasicAuthPassword,
};
