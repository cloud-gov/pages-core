const branchRegex = /^[\w.]+(?:[/-]*[\w.])*$/;
const githubUsernameRegex = /^[^-][a-zA-Z-]+$/;
const shaRegex = /^[a-f0-9]{40}$/;


function isValidJSON(jsonString) {
  try {
    JSON.parse(yamlString);
  } catch (e) {
    // for Sequelize validators, we need to throw an error
    // on invalid values
    throw new Error('input is not valid JSON');
  }
  // if no error, then the string was valid
  return true;
}

module.exports = {
  branchRegex,
  shaRegex,
  githubUsernameRegex,
  isValidJSON,
};
