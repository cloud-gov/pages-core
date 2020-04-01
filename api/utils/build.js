function buildUrl(build, site) {
  let path = `/preview/${site.owner}/${site.repository}/${build.branch}`;
  if (build.branch === site.defaultBranch) {
    path = `/site/${site.owner}/${site.repository}`;
  } else if (build.branch === site.demoBranch) {
    path = `/demo/${site.owner}/${site.repository}`;
  }
  return `https://${site.awsBucketName}.app.cloud.gov${path}`;
}

function buildViewLink(build, site) {
  let link = build.url || buildUrl(build, site); // user build.url shared bucket builds
  if ((build.branch === site.defaultBranch) && site.domain) {
    link = site.domain;
  } else if ((build.branch === site.demoBranch) && site.demoDomain) {
    link = site.demoDomain;
  }
  return `${link.replace(/\/+$/, '')}/`;
}

module.exports = { buildViewLink, buildUrl };
