function buildSiteLink(deployment, site) {
  const domain = `https://${site.awsBucketName}.app.cloud.gov`;
  const path = `/${deployment}/${site.owner}/${site.repository}`;
  let link = `${domain}${path}`;

  if (deployment === 'site' && site.domain) {
    link = site.domain;
  } else if (deployment === 'demo' && site.demoDomain) {
    link = site.demoDomain;
  }

  return `${link.replace(/\/+$/, '')}/`;
}

module.exports = { buildSiteLink };
