const GitHub = require('./GitHub');
const logger = require('winston');
const url = require('url');
const config = require('../../config');

const { User } = require('../models');

const audit18F = () => {
  const auditor_username = config.passport.github.federalistUsersAdmin;
  const fedUserTeams = config.passport.github.federalistUsersTeams;
  let members18F;
  let auditor;

  User.findOne({ where: { username: auditor_username } })
  .then(_auditor => {
    auditor = _auditor;
    return GitHub.getAllOrganizationMembers(auditor.githubAccessToken, '18F');
  })
  .then(members => {
    members18F = members.map(member => member.login);
    return Promise.all(fedUserTeams.map(fedUserTeam => GitHub.getTeamMembers(auditor.githubAccessToken,fedUserTeam)));
  })
  .then(teams => {
    removed = []
    teams.forEach(team => {
      team.forEach(member => {
        if (!members18F.includes(member.login)){
          removed.push(GitHub.removeOrganizationMember(auditor.githubAccessToken, 'federalist-users', member.login));
        }
      })
    })
    return Promise.all(removed);
  })
  .catch(logger.error)
}

module.exports = { audit18F };
