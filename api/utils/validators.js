const branchRegex = /^[a-zA-Z0-9._-]+$/;
const githubUsernameRegex = /^[^-][a-zA-Z-]+$/;
const shaRegex = /^[a-f0-9]{40}$/;

module.exports = {
  branchRegex,
  shaRegex,
  githubUsernameRegex,
};
