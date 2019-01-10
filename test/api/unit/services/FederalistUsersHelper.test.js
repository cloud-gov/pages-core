const expect = require('chai').expect;
const proxyquire =  require('proxyquire').noCallThru();

const factory = require('../../support/factory');
const MockGitHub = require('../../support/mockGitHub');
const fedUserHelper = proxyquire('../../../../api/services/FederalistUsersHelper', { './GitHub': MockGitHub });

describe('FederalistUsersHelper', () => {
  context('audit', () => {
    it('a user with sites joinsRooms(socket)', (done) => {
      let members1;
      let federalistUsers;
      let f81;
      let auditor_username;
      let fedUserTeams;

      factory.user()
        .then((user) => {
          auditor_username = user.username;
          fedUserTeams = ['12345', '54321'];
          members = MockGitHub.generateMembers('user');
          MockGitHub.addTeam('12345', [].concat(members));
          MockGitHub.addTeam('54321', [].concat(members));
          members1 = MockGitHub.getTeamMembers('githubAccessToken', '12345');
          expect(members1.length).to.equal(10);
          MockGitHub.addOrganization('18F', [].concat(members1));
          MockGitHub.addOrganization('federalist-users', members1);
          f81 = MockGitHub.getOrganizationMembers('token', '18F');
          federalistUsers = MockGitHub.getOrganizationMembers('token', 'federalist-users');
          expect(f81.length).to.equal(10);
          expect(federalistUsers.length).to.equal(10);
          MockGitHub.addTeamMember('12345', 'non-18F-user');
          expect(members1.length).to.equal(11);
          federalistUsers = MockGitHub.getOrganizationMembers('token', 'federalist-users');
          expect(federalistUsers.length).to.equal(11);
          return fedUserHelper.audit18F({ auditor_username, fedUserTeams })
        })
        .then(() => {
          members1 = MockGitHub.getTeamMembers('githubAccessToken', '12345');
          expect(f81.length).to.equal(10);
          federalistUsers = MockGitHub.getOrganizationMembers('token', 'federalist-users');
          expect(federalistUsers.length).to.equal(10);
          return fedUserHelper.audit18F({ auditor_username, fedUserTeams });
        })
        .then(() => {
          members1 = MockGitHub.getTeamMembers('githubAccessToken', '12345');
          expect(f81.length).to.equal(10);
          federalistUsers = MockGitHub.getOrganizationMembers('token', 'federalist-users');
          expect(federalistUsers.length).to.equal(10);
          done();
        })
        .catch(done);
    })
  });
});
