const config = require('../../config');

function previewPath(build, site) {
  return `/preview/${site.owner}/${site.repository}/${build.branch}`;
}

function proxyUrl(path, site) {
  const { proxyDomain } = config.app;
  const url = new URL(path, `https://${site.awsBucketName}.${proxyDomain}`);
  // use a trailing slash to prevent the browser from interpreting
  // branch names with dots as file extensions
  return url.href + '/';
}

/* canonical url for a build:
  - if we don't have a matching site branch config, use the preview url
  - if we don't have a matching domain, use the site branch config s3key path
  - use the custom domain
*/
function buildUrl(build, site) {
  const { SiteBranchConfigs, Domains } = site;

  const siteBranchConfig = SiteBranchConfigs.find((sbc) => sbc.branch === build.branch);

  if (!siteBranchConfig) {
    return proxyUrl(previewPath(build, site), site);
  }

  const domain = Domains.find(
    (d) => d.siteBranchConfigId === siteBranchConfig.id && d.state === 'provisioned',
  );

  if (!domain) {
    return proxyUrl(siteBranchConfig.s3Key, site);
  }

  const domainName = domain.names.split(',')[0];

  return `https://${domainName.replace(/\/+$/, '')}/`;
}

/* generate SITE_PREFIX for builds
 uses similar but slightly different logic to buildUrl
(ignores domains, no proxyUrl, no leading slashes)
*/
function sitePrefix(build, site) {
  const { SiteBranchConfigs } = site;

  const siteBranchConfig = SiteBranchConfigs.find((sbc) => sbc.branch === build.branch);

  const path = siteBranchConfig ? siteBranchConfig.s3Key : previewPath(build, site);

  return path.replace(/^(\/)+/, '');
}

module.exports = { buildUrl, sitePrefix };
