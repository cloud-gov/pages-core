const config = require('../../config');

function buildPath(build, site) {
  const sbc = site?.SiteBranchConfigs?.find(c => c.branch === build.branch);

  if (sbc) {
    return sbc.s3Key;
  }

  return `/preview/${site.owner}/${site.repository}/${build.branch}`;
}

function buildUrl(build, site) {
  const { proxyDomain } = config.app;
  const path = buildPath(build, site);
  const url = new URL(path, `https://${site.awsBucketName}.${proxyDomain}`);

  return url.href;
}

function buildViewLink(build, site) {
  let link;

  // Todo Update site domain and demo domain to look at Domain table based on context
  if (build.branch === site.defaultBranch && site.domain) {
    link = site.domain;
  } else if (build.branch === site.demoBranch && site.demoDomain) {
    link = site.demoDomain;
  } else {
    link = build.url || buildUrl(build, site);
  }
  return `${link.replace(/\/+$/, '')}/`;
}

module.exports = { buildViewLink, buildUrl };
