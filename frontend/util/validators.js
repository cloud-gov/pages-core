const yaml = require('js-yaml');

const validBranchName = s => /^[\w._]+(?:[/-]*[\w._])*$/.test(s);

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
};
