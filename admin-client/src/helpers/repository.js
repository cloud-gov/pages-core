import globals from '../globals';

export const repositoryInfo = (sourceCodePlatform, owner, repo) => {
  const isWorkshop = sourceCodePlatform == globals.SOURCE_CODE_PLATFORM_WORKSHOP;

  const baseUrl = isWorkshop ? globals.GITLAB_BASE_URL : 'https://github.com';
  const href = `${baseUrl}/${owner}/${repo}`;
  const icon = isWorkshop ? 'gitlab' : 'github';

  return { href, icon };
};
