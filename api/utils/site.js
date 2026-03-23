const config = require('../../config');
const { getGitLabBaseUrl } = require('../services/GitLabHelper');

const { proxyDomain, githubBaseUrl } = config.app;

function path(site, deployment) {
  return `/${deployment}/${site.owner}/${site.repository}`;
}

function siteViewOrigin(site) {
  return `${site.awsBucketName}.${proxyDomain}`;
}

function siteViewDomain(site) {
  return `https://${siteViewOrigin(site)}`;
}

function buildSourceCodeUrl(owner, repository, sourceCodePlatform, platformsWorkshop) {
  // eslint-disable-next-line max-len
  return `${sourceCodePlatform === platformsWorkshop ? getGitLabBaseUrl() : githubBaseUrl}/${owner}/${repository}`;
}

function siteViewLink(site, deployment = 'site') {
  let link;
  if (deployment === 'site' && site.domain) {
    link = site.domain;
  } else if (deployment === 'demo' && site.demoDomain) {
    link = site.demoDomain;
  } else {
    link = `${siteViewDomain(site)}${path(site, deployment)}`;
  }
  // eslint-disable-next-line sonarjs/slow-regex
  return `${link.replace(/\/+$/, '')}/`;
}

const hideBasicAuthPassword = ({ username, password }) => {
  if (password && password.length) {
    return {
      username,
      // eslint-disable-next-line sonarjs/no-hardcoded-passwords
      password: '**********',
    };
  }
  return {};
};

module.exports = {
  path,
  siteViewLink,
  siteViewDomain,
  siteViewOrigin,
  hideBasicAuthPassword,
  buildSourceCodeUrl,
};
