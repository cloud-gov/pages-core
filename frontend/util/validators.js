import { load } from 'js-yaml';
import { hasOrgs } from '../selectors/organization';

const validAddRepoSiteForm = ({ repoOrganizationId, repoUrl }, { organizations }) => {
  const errors = {};

  if (!repoUrl) {
    errors.repoUrl = 'Please enter a Github repository URL';
  }

  if (hasOrgs(organizations) && !repoOrganizationId) {
    errors.repoOrganizationId = 'Please select an organization';
  }

  return errors;
};

const validBranchName = (s) => /^[\w._]+(?:[/-]*[\w._])*$/.test(s);

const validBasicAuthUsername = (s) =>
  /^(?!.*[:])(?=.*[a-zA-Z0-9]).{4,255}$/.test(s)
    ? undefined
    : 'Value is required and must be at least 4 characters. Semicolons are not allowed.';

const validBasicAuthPassword = (s) =>
  /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{4,255}$/.test(s)
    ? undefined
    : // eslint-disable-next-line max-len
      'Value is required and must be at least 4 characters. At least 1 uppercase, 1 lowercase and 1 number is required';

function isValidYaml(yamlString) {
  try {
    load(yamlString);
  } catch (_) {
    // for Sequelize validators, we need to throw an error
    // on invalid values
    throw new Error('input is not valid YAML');
  }
  // if no error, then the string was valid
  return true;
}

export {
  isValidYaml,
  validAddRepoSiteForm,
  validBranchName,
  validBasicAuthUsername,
  validBasicAuthPassword,
};
