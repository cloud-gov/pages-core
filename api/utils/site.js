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

module.exports = { siteViewLink, siteViewDomain };
