const { siteViewDomain } = require('./site');

function buildUrl(build, site) {
  const path = buildPath(build, site);
  return `https://${site.awsBucketName}.app.cloud.gov${path}`;
}

function buildViewLink(build, site) {
  
  let link;
  if ((build.branch === site.defaultBranch) && site.domain) {
    link = site.domain;
  } else if ((build.branch === site.demoBranch) && site.demoDomain) {
    link = site.demoDomain;
  } else {
    link = `${siteViewDomain(site)}${buildPath(build, site)}`;
  }
  return `${link.replace(/\/+$/, '')}/`;
}

function buildPath(build, site) {
  let path = `/preview/${site.owner}/${site.repository}/${build.branch}`;
  if (build.branch === site.defaultBranch) {
    path = `/site/${site.owner}/${site.repository}`;
  } else if (build.branch === site.demoBranch) {
    path = `/demo/${site.owner}/${site.repository}`;
  }
  return path;
}

module.exports = { buildViewLink, buildUrl };
