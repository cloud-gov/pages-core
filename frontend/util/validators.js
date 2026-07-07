import { load } from 'js-yaml';
import { hasOrgs } from '../selectors/organization';

const githubUrlRegex = /^https:\/\/github\.com\/[a-zA-Z0-9._-]{2,}\/[a-zA-Z0-9._-]{2,}$/;
const gitLabUrlRegExp = /^(https?:\/\/[^/]+)(?:\/[a-zA-Z0-9._-]+)*$/;

const validAddRepoSiteForm = (
  { repoOrganizationId, repoUrl, engine },
  { organizations },
) => {
  const errors = {};

  if (!repoUrl) {
    const orGitLabProject = `${
      process.env.FEATURE_WORKSHOP_INTEGRATION === 'true' ? ' or GitLab project ' : ' '
    }`;

    errors.repoUrl = `Please enter a GitHub repository${orGitLabProject}URL`;
  }

  if (hasOrgs(organizations) && !repoOrganizationId) {
    errors.repoOrganizationId = 'Please select an organization';
  }

  if (!engine) {
    errors.engine = 'Please select a site engine';
  }

  return errors;
};

const validAddTemplateSiteForm = ({
  repoOrganizationId,
  sourceCodePlatform,
  owner,
  repository,
}) => {
  const errors = {};

  if (!repoOrganizationId) {
    errors.repoOrganizationId = 'Please select an organization';
  }

  if (!sourceCodePlatform) {
    errors.sourceCodePlatform = 'Please select source code provider';
  }

  if (!owner) {
    errors.owner = 'Please select an owner';
  }

  if (!repository) {
    errors.repository = 'Please select a repository';
  }

  return errors;
};

export const sourceCodePlatformUrl = (value) => {
  const githubValidation = githubUrlRegex.test(value);
  const gitlabValidation =
    process.env.FEATURE_WORKSHOP_INTEGRATION === 'true'
      ? gitLabUrlRegExp.test(value)
      : false;
  if (value && value.length && !(githubValidation || gitlabValidation)) {
    return 'URL is not formatted correctly';
  }
  return undefined;
};

// eslint-disable-next-line
const validBranchName = (s) => /^[\w._]+(?:[/-]*[\w._])*$/.test(s);

function isValidYaml(yamlString) {
  try {
    load(yamlString);
  } catch {
    // for Sequelize validators, we need to throw an error
    // on invalid values
    throw new Error('input is not valid YAML');
  }
  // if no error, then the string was valid
  return true;
}

export { isValidYaml, validAddRepoSiteForm, validAddTemplateSiteForm, validBranchName };
