
function getOrganizationMembers(githubAccessToken, orgName = '18F') {
  this.organizations = this.organizations || {};
  this.organizations[orgName] = this.organizations[orgName] || [];
  return this.organizations[orgName];
}

function getTeamMembers(githubAccessToken, teamId) {
  this.teams = this.teams || {}
  this.teams[teamId] = this.teams[teamId] || [];
  return this.teams[teamId];
}

function addTeamMember(teamId, username) {
  this.teams = this.teams || {}
  this.teams[teamId] = this.teams[teamId] || [];
  this.teams[teamId].push({ login: username });
}

function addOrganizationMember(orgName, username) {
  this.organizations = this.organizations || {};
  this.organizations[orgName] = this.organizations[orgName] || [];
  this.organizations[orgName].push({ login: username });
}

function addOrganization(orgName, members = []) {
  this.organizations = this.organizations || {};
  this.organizations[orgName] = this.organizations[orgName] || [];
  this.organizations[orgName] = members;
}

function addTeam(teamId, members = []) {
  this.teams = this.teams || {}
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

function generateMembers(name,size = 10) {
  const members = []
  let i;
  for(i=0; i < size; i++) {
    members.push({ login: `${name}-${i}`})
  }
  return members;
}

function removeOrganizationMember(githubAccessToken, orgName, removeUser) {
  this.organizations = this.organizations || {};
  this.organizations[orgName] = this.organizations[orgName] || [];
  this.organizations[orgName] = this.organizations[orgName].filter(member => member.login !== removeUser);
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
};
