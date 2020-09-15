const expect = require('chai').expect;
const sinon = require('sinon');

const factory = require('../../support/factory');
const GitHub = require('../../../../api/services/GitHub');
const FederalistUsersHelper = require('../../../../api/services/FederalistUsersHelper');

describe('FederalistUsersHelper', () => {
  let orgs;
  const fedUserTeams = ['0', '1'];

  const getOrg = (orgName, role = 'all') => {
    if(role !== 'all') {
      return orgs[orgName].filter(o => o.role === role)
    }
    return orgs[orgName];
  }

  const populateOrg = (orgName) => {
    orgs[orgName] = Array(10).fill(0).map((a, index) => ({ login: `member-${index}`, team: `${index % 2}` }));
    return orgs[orgName];
  }

  const addMember = (orgName, login, role = 'member', team = null) => orgs[orgName].push({ login, role, team: team ? team: `${orgs[orgName].length % 2}` });

  const isOrgMember = (orgName, login) => getOrg('federalist-users').find(m => m.login === login) ? true : false;

  beforeEach(() => {
    orgs = {};
    populateOrg('federalist-users');
    populateOrg('18F');

    sinon.stub(GitHub, 'getOrganizationMembers').callsFake((githubAccessToken, orgName, role = 'all') => Promise.resolve(getOrg(orgName, role)));
    
    sinon.stub(GitHub, 'removeOrganizationMember').callsFake((githubAccessToken, orgName, login) => {
      orgs[orgName] = orgs[orgName].filter(o => o.login !== login);
      return Promise.resolve();
    });

    sinon.stub(GitHub, 'getTeamMembers').callsFake((githubAccessToken, orgName, team) => Promise.resolve(getOrg(orgName).filter(o => o.team === team)));
  })


  afterEach(() => sinon.restore())

  describe('audit18F', () => {

    it('remove federalist-users all in 18F team not in 18F org ', (done) => {
      expect(getOrg('federalist-users').length).to.equal(10);
      addMember('federalist-users', 'new-member-1', 'member', '0');
      addMember('federalist-users', 'new-member-2', 'member', '0');

      expect(getOrg('federalist-users').length).to.equal(12);
      expect(isOrgMember('federalist-users', 'new-member-1')).to.be.true;
      expect(isOrgMember('federalist-users', 'new-member-2')).to.be.true;

      factory.user()
        .then(user => FederalistUsersHelper.audit18F({ auditorUsername: user.username, fedUserTeams }))
        .then(() => {
          expect(getOrg('federalist-users').length).to.equal(10);
          expect(isOrgMember('federalist-users', 'new-member-1')).to.be.false;
          expect(isOrgMember('federalist-users', 'new-member-2')).to.be.false;
          done();
        });
    });

    it('remove federalist-users in 18F team not in 18F org', (done) => {
      expect(getOrg('federalist-users').length).to.equal(10);
      addMember('federalist-users', 'new-member-1', 'member', '0');
      addMember('federalist-users', 'new-member-2', 'member', '1');
      addMember('federalist-users', 'new-member-3', 'member', '1');

      expect(getOrg('federalist-users').length).to.equal(13);
      expect(isOrgMember('federalist-users', 'new-member-1')).to.be.true;
      expect(isOrgMember('federalist-users', 'new-member-2')).to.be.true;
      expect(isOrgMember('federalist-users', 'new-member-3')).to.be.true;

      factory.user()
        .then(user => FederalistUsersHelper.audit18F({ auditorUsername: user.username, fedUserTeams: ['1'] }))
        .then(() => {
          expect(getOrg('federalist-users').length).to.equal(11);
          expect(isOrgMember('federalist-users', 'new-member-1')).to.be.true;
          expect(isOrgMember('federalist-users', 'new-member-2')).to.be.false;
          expect(isOrgMember('federalist-users', 'new-member-3')).to.be.false;
          done();
        });
    });

    it('should not remove org admins not in 18F org ', (done) => {
      expect(getOrg('federalist-users').length).to.equal(10);
      addMember('federalist-users', 'new-admin-1', 'admin', '0');
      expect(getOrg('federalist-users').length).to.equal(11);
      factory.user()
        .then(user => FederalistUsersHelper.audit18F({ auditorUsername: user.username, fedUserTeams }))
        .then(() => {
          expect(getOrg('federalist-users').length).to.equal(11);
          done();
        });
    });
    describe('federalistUsersAdmins', () => {
      it('identify org admins in federalist-users', (done) => {
        addMember('federalist-users', 'new-admin-1', 'admin', '0');
        
        FederalistUsersHelper.federalistUsersAdmins('githubAccessToken')
          .then((admins) => {
            expect(admins.length).to.equal(1);
            addMember('federalist-users', 'new-admin-2', 'admin', '1');
            return FederalistUsersHelper.federalistUsersAdmins('githubAccessToken');
          })
          .then((admins) => {
            expect(admins.length).to.equal(2);
            done();
          });
      });
    });
  });
});
