function getOrganizationMembers(githubAccessToken, orgName = '18F', role = 'all') {
  this.organizations = this.organizations || {};
  if (this.organizations[orgName] === undefined) {
    return Promise.reject(new Error('org does not exist'));
  }

  if (role === 'member') {
    return this.organizations[orgName].filter((m) => m.role === 'member');
  }

  if (role === 'admin') {
    return this.organizations[orgName].filter((m) => m.role === 'admin');
  }

  return this.organizations[orgName];
}

function getTeamMembers(githubAccessToken, org, teamId) {
  this.teams = this.teams || {};
  this.teams[teamId] = this.teams[teamId] || [];
  return this.teams[teamId];
}

function addTeamMember(teamId, username, role = 'member') {
  this.teams = this.teams || {};
  this.teams[teamId] = this.teams[teamId] || [];
  this.teams[teamId].push({
    login: username,
    role,
  });
}

function addOrganizationMember(orgName, username, role = 'member') {
  this.organizations = this.organizations || {};
  this.organizations[orgName] = this.organizations[orgName] || [];
  this.organizations[orgName].push({
    login: username,
    role,
  });
}

function addOrganization(orgName, members = []) {
  this.organizations = this.organizations || {};
  this.organizations[orgName] = this.organizations[orgName] || [];
  this.organizations[orgName] = members;
}

function addTeam(teamId, members = []) {
  this.teams = this.teams || {};
  this.teams[teamId] = members;
}

function getTeams() {
  this.teams = this.teams || {};
  return this.teams;
}

function getOrganizations() {
  this.organizations = this.organizations || {};
  return this.organizations;
}

function generateMembers(name, size = 10) {
  const members = [];
  let i;
  for (i = 0; i < size; i += 1) {
    if (i % 10 === 0) {
      members.push({
        login: `${name}-${i}`,
        role: 'admin',
      });
    } else {
      members.push({
        login: `${name}-${i}`,
        role: 'member',
      });
    }
  }
  return members;
}

function removeOrganizationMember(githubAccessToken, orgName, removeUser) {
  this.organizations = this.organizations || {};
  this.organizations[orgName] = this.organizations[orgName] || [];
  this.organizations[orgName] = this.organizations[orgName].filter(
    (m) => m.login !== removeUser,
  );
}

function getRepositories(githubAccessToken, size = 10) {
  const repos = [];
  let i;
  for (i = 0; i < size; i += 1) {
    if (i % 10 === 0) {
      repos.push({
        full_name: `owner/repo-${i}`,
        permissions: {
          push: false,
        },
      });
    } else {
      repos.push({
        full_name: `owner/repo-${i}`,
        permissions: {
          push: true,
        },
      });
    }
  }
  return Promise.resolve(repos);
}

function getCollaborators(githubAccessToken, owner, repo, size = 10) {
  if (githubAccessToken === 'reject') {
    return Promise.reject();
  }
  const members = [];
  let i;
  for (i = 0; i < size; i += 1) {
    if (i % 10 === 0) {
      members.push({
        login: `username-${i}`,
        permissions: {
          push: false,
        },
      });
    } else {
      if (i % 2 === 0) {
        members.push({
          login: `username-${i}`,
          permissions: {
            push: true,
          },
        });
      } else {
        members.push({
          login: `userName-${i}`,
          permissions: {
            push: true,
          },
        });
      }
    }
  }
  return Promise.resolve(members);
}

module.exports = {
  getOrganizationMembers,
  getTeamMembers,
  addTeamMember,
  addOrganizationMember,
  addOrganization,
  addTeam,
  getTeams,
  generateMembers,
  getOrganizations,
  removeOrganizationMember,
  getCollaborators,
  getRepositories,
};
