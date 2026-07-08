import globals from '@globals';

const isWorkshopIntegration = process.env.FEATURE_WORKSHOP_INTEGRATION === 'true';

function getOwnerAndRepo(repoUrl) {
  if (repoUrl.startsWith(globals.GITLAB_BASE_URL)) {
    const [, owner, ...rest] = repoUrl.replace(globals.GITLAB_BASE_URL, '').split('/');

    return {
      owner,
      repository: rest.join('/'),
      sourceCodePlatform: globals.SOURCE_CODE_PLATFORM_WORKSHOP,
      sourceCodeUrl: repoUrl,
      isWorkshop: true,
    };
  } else {
    const owner = repoUrl.split('/')[3];
    const repository = repoUrl.split('/')[4];

    return {
      owner,
      repository,
      sourceCodePlatform: 'github',
      sourceCodeUrl: repoUrl,
      isWorkshop: false,
    };
  }
}

function getBaseUrl(sourceCodePlatform) {
  if (isGitLab(sourceCodePlatform)) return globals.GITLAB_BASE_URL;
  if (isGitHub(sourceCodePlatform)) return globals.GITHUB_BASE_URL;
  return null;
}

function stripSlashes(str) {
  let start = 0;
  let end = str.length;
  while (start < end && str[start] === '/') start += 1;
  while (end > start && str[end - 1] === '/') end -= 1;
  return str.slice(start, end);
}

function getRepoUrl(sourceCodePlatform, owner, repository) {
  if (!owner || !repository) return '';

  const trimmedOwner = stripSlashes(owner);
  const trimmedRepository = stripSlashes(repository);
  const baseUrl = getBaseUrl(sourceCodePlatform);

  return baseUrl ? `${baseUrl}/${trimmedOwner}/${trimmedRepository}` : '';
}

function isGitHub(sourceCodePlatform) {
  return sourceCodePlatform === globals.SOURCE_CODE_PLATFORM_GITHUB;
}

function isGitLab(sourceCodePlatform) {
  return sourceCodePlatform === globals.SOURCE_CODE_PLATFORM_WORKSHOP;
}

function getTemplateExampleUrl(templates) {
  if (!templates) return null;
  const values = Object.values(templates);
  const example = values.length > 0 ? values[0].example : null;
  return example;
}

function getTemplateName(sourceCodePlatform) {
  return isGitHub(sourceCodePlatform) ? 'uswds-11ty' : 'workshop-uswds-11ty';
}

export {
  getOwnerAndRepo,
  getRepoUrl,
  isGitHub,
  isGitLab,
  getTemplateExampleUrl,
  getTemplateName,
  isWorkshopIntegration,
};
