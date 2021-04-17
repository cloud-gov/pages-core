const expect = require('chai').expect;
const sinon = require('sinon');
const { Op } = require('sequelize');

const factory = require('../../support/factory');
const { User, Event, sequelize } = require('../../../../api/models');
const GitHub = require('../../../../api/services/GitHub');
const EventCreator = require('../../../../api/services/EventCreator');
const FederalistUsersHelper = require('../../../../api/services/FederalistUsersHelper');

describe('FederalistUsersHelper', () => {
  let orgs;
  let removeOrganizationMemberStub;
  const fedUserTeams = ['0', '1'];

  const getOrg = (orgName, role = 'all') => {
    if(role !== 'all') {
      return orgs[orgName].filter(o => o.role === role)
    }
    return orgs[orgName];
  }

  const seedOrg = (orgName) => {
    orgs[orgName] = Array(10).fill(0).map((a, index) => ({ login: `member-${index}`, role: 'member', team: `${index % 2}` }));
    return orgs[orgName];
  }

  const addMember = (orgName, login, role = 'member', team = null) => orgs[orgName].push({ login, role, team: team ? team: `${orgs[orgName].length % 2}` });

  const isOrgMember = (orgName, login) => getOrg('federalist-users').find(m => m.login === login) ? true : false;

  beforeEach(() => {
    orgs = {};
    seedOrg('federalist-users');
    seedOrg('18F');

    sinon.stub(GitHub, 'getOrganizationMembers').callsFake((githubAccessToken, orgName, role = 'all') => Promise.resolve(getOrg(orgName, role)));
    
    removeOrganizationMemberStub = sinon.stub(GitHub, 'removeOrganizationMember').callsFake((githubAccessToken, orgName, login) => {
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
        .then(user => FederalistUsersHelper.audit18F({
          auditorUsername: user.username,
          fedUserTeams: ['1']
        }))
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

  describe('revokeMembershipForInactiveUsers', () => {
    afterEach( async () => {
      await User.truncate();
    });
    it('should remove user (not org admin) created, pushed and signed in before x cutoff days', async () => {
      const before = new Date('2020-02-02');
      const now = new Date();
      const admin = await factory.user({ pushedAt: before, signedInAt: before, isActive: true });
      const inactiveUsers = await Promise.all([
        factory.user({ pushedAt: before, signedInAt: before, isActive: true }),
        factory.user({ pushedAt: before, signedInAt: before, isActive: true }),
      ]);
      await sequelize.query(`UPDATE "user" set "createdAt" = '2000-01-01' where id in (${inactiveUsers.map(u => u.id).join(',')});`);
      const activeUsers = await Promise.all([
        factory.user({ isActive: true }),
        factory.user({ isActive: true }),
        factory.user({ isActive: true }),
      ]);
      const newUsers = inactiveUsers.concat(activeUsers);
      newUsers.forEach(user => addMember('federalist-users', user.username));
      addMember('federalist-users', admin.username.toUpperCase(), 'admin');
      expect(getOrg('federalist-users').length).to.equal(16);
      await FederalistUsersHelper.revokeMembershipForInactiveUsers({ auditorUsername: admin.username });
      expect(removeOrganizationMemberStub.callCount).to.equal(2);
      expect(getOrg('federalist-users').length).to.equal(14);
    });

    it('should not remove user if created, pushed or signed in within x cutoff days', async () => {
      const admin = await factory.user();
      const before = new Date('2020-02-02');
      const now = new Date();
      const oldCreatedAtUsers = await Promise.all([
        factory.user({ pushedAt: before, signedInAt: now, isActive: true }),
        factory.user({ pushedAt: now, signedInAt: before, isActive: true }),
      ]);
      await sequelize.query(`UPDATE "user" set "createdAt" = '2000-01-01' where id in (${oldCreatedAtUsers.map(u => u.id).join(',')});`);
      const newCreatedAtUsers = await Promise.all([
        factory.user({ pushedAt: before, signedInAt: before, isActive: true }),
        factory.user({ isActive: true }),
        factory.user({ isActive: true }),
      ]);
      const testUsers = oldCreatedAtUsers.concat(newCreatedAtUsers);    
      testUsers.forEach(user => addMember('federalist-users', user.username));
      addMember('federalist-users', admin.username, 'admin');
      expect(getOrg('federalist-users').length).to.equal(16);
      await FederalistUsersHelper.revokeMembershipForInactiveUsers({ auditorUsername: admin.username });
      expect(removeOrganizationMemberStub.callCount).to.equal(0);
      expect(getOrg('federalist-users').length).to.equal(16);
    });
  });

  describe('removeMembersWhoAreNotUsers', () => {
    afterEach( async () => {
      await User.truncate();
    });
    it('should only remove github org members who are not users', async () => {
      const admin = await factory.user();
      const users = await Promise.all(Array(5).fill(0).map((i) => factory.user()));
      users.forEach(user => addMember('federalist-users', user.username));
      addMember('federalist-users', admin.username, 'admin');
      addMember('federalist-users', 'non-user-admin', 'admin');
      expect(getOrg('federalist-users').length).to.equal(17);
      await FederalistUsersHelper.removeMembersWhoAreNotUsers({ auditorUsername: admin.username });
      expect(getOrg('federalist-users').length).to.equal(7);
    });
  });

  describe('deactivateUsersWhoAreNotMembers', () => {
    let eventStub;
    beforeEach( async() => {
      eventStub = sinon.stub(EventCreator, 'audit').resolves();
      await User.truncate();
    });

    it('set inactive users to Active if in federalist-users', async () => {
      const admin = await factory.user();
      addMember('federalist-users', admin.username);
      const users = [admin];
      let i;
      for (i = 0; i < 4; i += 1) {
        const user = await await factory.user();
        users.push(user);
        if (i < 2 ) {
          addMember('federalist-users', user.username.toUpperCase());
        }  
      }
      expect(users.filter(user => user.isActive).length).to.equal(5);
      await FederalistUsersHelper.deactivateUsersWhoAreNotMembers({ auditorUsername: admin.username });
      const allUsers = await User.findAll();
      expect(allUsers.filter(user => user.isActive).length).to.equal(3);
      expect(allUsers.filter(user => !user.isActive).length).to.equal(2);
      expect(eventStub.callCount).to.equal(2);
    });
  });
});
