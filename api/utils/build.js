const config = require('../../config');

function buildPath(build, site) {
  const sbc = site?.SiteBranchConfigs?.find((c) => c.branch === build.branch);

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
  const { SiteBranchConfigs, Domains } = site;

  if (build.url) {
    const regex = /(http|https):\/\/+/;

    if (regex.test(build.url)) {
      return `${build.url.replace(regex, 'https://')}/`;
    }

    return `https://${build.url}/`;
  }

  const siteBranchConfig = SiteBranchConfigs.find((sbc) => sbc.branch === build.branch);

  if (!siteBranchConfig) {
    return `${buildUrl(build, site)}/`;
  }

  const domain = Domains.find(
    (d) => d.siteBranchConfigId === siteBranchConfig.id && d.state === 'provisioned',
  );

  if (!domain) {
    return `${buildUrl(build, site)}/`;
  }

  const domainName = domain.names.split(',')[0];

  return `https://${domainName.replace(/\/+$/, '')}/`;
}

module.exports = {
  buildViewLink,
  buildUrl,
};
