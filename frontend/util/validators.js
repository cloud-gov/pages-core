const yaml = require('js-yaml');

const validBranchName = s => /^[\w._]+(?:[/-]*[\w._])*$/.test(s);

const validBasicAuthUsername = s => /^[a-zA-Z0-9_-]+{3,15}$/.test(s);

const validBasicAuthPassword = s => /^[a-zA-Z0-9_\-\$!@]{6,15}$/.test(s);

function isValidYaml(yamlString) {
  try {
    yaml.safeLoad(yamlString);
  } catch (e) {
    // for Sequelize validators, we need to throw an error
    // on invalid values
    throw new Error('input is not valid YAML');
  }
  // if no error, then the string was valid
  return true;
}

module.exports = {
  isValidYaml,
  validBranchName,
  validBasicAuthUsername,
  validBasicAuthPassword,
};
