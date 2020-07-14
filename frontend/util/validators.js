const yaml = require('js-yaml');

const validBranchName = s => /^[\w._]+(?:[/-]*[\w._])*$/.test(s);

const validBasicAuthUsername = s => /^(?!.*[:])(?=.*[a-zA-Z0-9]).{4,255}$/.test(s) ? undefined : 'Value is required and must be at least 4 characters. Allowed symbols: .-_@';

const validBasicAuthPassword = s => /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{4,255}$/.test(s) ? undefined : 'Value is required and must be at least 4 characters. At leaset 1 uppercase, 1 lowercase and 1 number is required';

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
