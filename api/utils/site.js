const config = require('../../config');

function siteViewLink(deployment, site) {
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

function siteViewDomain(site){
  const subdomain = site.subdomain || `site-${site.id}`;  //temp site id until added in database
  return config.app.proxyPreviewHost.replace('*', subdomain);// + path;	
}

module.exports = { buildSiteLink, siteViewDomain };
