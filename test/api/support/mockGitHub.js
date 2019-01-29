
function getRepositories(githubAccessToken, size = 10) {
  const repos = [];
  let i;
  for (i = 0; i < size; i += 1) {
    if ((i % 10) === 0) {
      repos.push({ full_name: `owner/repo-${i}`, permissions: { push: false } });
    } else {
      repos.push({ full_name: `owner/repo-${i}`, permissions: { push: true } });
    }
  }
  return Promise.resolve(repos);
}

function getCollaborators(githubAccessToken, owner, repo, size = 10) {
  const members = [];
  let i;
  for (i = 0; i < size; i += 1) {
    if ((i % 10) === 0) {
      members.push({ login: `username-${i}`, permissions: { push: false } });
    } else {
      members.push({ login: `username-${i}`, permissions: { push: true } });
    }
  }
  return Promise.resolve(members);
}

module.exports = {
  getCollaborators,
  getRepositories,
};
