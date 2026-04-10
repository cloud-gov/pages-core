import globals from '@globals';

const isWorkshopIntegration = process.env.FEATURE_WORKSHOP_INTEGRATION === 'true';

function getOwnerAndRepo(repoUrl) {
  if (repoUrl.startsWith(globals.GITLAB_BASE_URL) && isWorkshopIntegration) {
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

export { getOwnerAndRepo, isWorkshopIntegration };
