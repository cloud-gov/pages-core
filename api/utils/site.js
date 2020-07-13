const config = require('../../config');

function siteViewLink(site, deployment = 'site') {
  let link;
  if (deployment === 'site' && site.domain) {
    link = site.domain;
  } else if (deployment === 'demo' && site.demoDomain) {
    link = site.demoDomain;
  } else {
    const path = `/${deployment}/${site.owner}/${site.repository}`;
    link = `${siteViewDomain(site)}${path}`;
  }
  return `${link.replace(/\/+$/, '')}/`;
}

function siteViewDomain(site) {
  return config.app.proxyPreviewHost.replace('*', site.subdomain);
}

const hideBasicAuthPassword = ({ username, password }) => {
  if (password && password.length) {
    return { username, password: '**********' };
  }
  return {};
};

module.exports = { siteViewLink, siteViewDomain, hideBasicAuthPassword };
