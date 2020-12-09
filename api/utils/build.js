const { siteViewDomain } = require('./site');
const Features = require('../features');

function buildPath(build, site) {
  const branchPath = build.branch.replace(/\/+/g, '-'); // if branch contains '/' replace with '-'
  let path = `/preview/${site.owner}/${site.repository}/${branchPath}`;
  if (build.branch === site.defaultBranch) {
    path = `/site/${site.owner}/${site.repository}`;
  } else if (build.branch === site.demoBranch) {
    path = `/demo/${site.owner}/${site.repository}`;
  }
  return path;
}

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
  } else if (Features.enabled(Features.Flags.FEATURE_PROXY_EDGE_LINKS)) {
    link = `${siteViewDomain(site)}${buildPath(build, site)}`;
  } else {
    link = build.url || buildUrl(build, site);
  }
  return `${link.replace(/\/+$/, '')}/`;
}

module.exports = { buildViewLink, buildUrl };
