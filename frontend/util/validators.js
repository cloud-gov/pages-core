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

export { isValidYaml, validAddRepoSiteForm, validBranchName };
