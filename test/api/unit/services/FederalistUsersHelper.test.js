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
    orgs[orgName] = Array(10).fill(0).map((a, index) => ({ login: `member-${index}`, team: `${index % 2}` }));
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
  describe('refreshIsActiveUsers', () => {
    let eventSpy;
    beforeEach(() => {
      eventStub = sinon.stub(EventCreator, 'audit').resolves();
    });
    afterEach( async () => {
      await User.truncate();
      await Event.truncate();
    })

    it('set inactive users to Active if in federalist-users', async () => {
      let users = await Promise.all([
        factory.user(),
        factory.user(),
        factory.user(),
      ]);

      addMember('federalist-users', users[0].username);
      addMember('federalist-users', users[1].username);
      expect(users.filter(user => user.isActive).length).to.equal(0);
      await FederalistUsersHelper.refreshIsActiveUsers(users[0].username);
      users = await User.findAll({
        where: {
          id: {
            [Op.in]: users.map(user => user.id),
          }
        }
      });
      expect(users.filter(user => user.isActive).length).to.equal(2);
      expect(eventStub.callCount).to.equal(2);
    });

    it('set active users to inactive if not in federalist-users', async () => {
      let users = await Promise.all([
        factory.user({ isActive: true }),
        factory.user({ isActive: true }),
        factory.user({ isActive: true }),
      ]);

      addMember('federalist-users', users[0].username);

      expect(users.filter(user => user.isActive).length).to.equal(3);
      await FederalistUsersHelper.refreshIsActiveUsers(users[0].username);
      users = await User.findAll({
        where: {
          id: {
            [Op.in]: users.map(user => user.id),
          }
        }
      });
      expect(users.filter(user => user.isActive).length).to.equal(1);
      expect(eventStub.callCount).to.equal(2);
    });
  });

  describe('removeInactiveMembers', () => {
    afterEach( async () => {
      await Event.truncate();
    })
    it('should not remove a member if they have logged in within 90 days', async () => {
      const signedInAt = new Date();
      const admin = await factory.user();

      await Promise.all(Array(10).fill(0).map( async (a, index) => {
        const u = await factory.user({ isActive: true, signedInAt })
        addMember('federalist-users', u.username)
      }));
      expect(getOrg('federalist-users').length).to.equal(20);
      await FederalistUsersHelper.removeInactiveMembers({ auditorUsername: admin.username });
      expect(removeOrganizationMemberStub.callCount).to.equal(10);
      expect(getOrg('federalist-users').length).to.equal(10);
    });

    it('should remove a member if they have not logged in for > 90 days or never', async () => {
      const now = new Date();
      const past = new Date('2000-01-01');
      const admin = await factory.user();

      await Promise.all(Array(10).fill(0).map( async (a, index) => {
        const u = await factory.user({ isActive: true, signedInAt: (index > 6 ? past : now ) })
        addMember('federalist-users', u.username)
      }));

      expect(getOrg('federalist-users').length).to.equal(20);
      await FederalistUsersHelper.removeInactiveMembers({ auditorUsername: admin.username });
      expect(removeOrganizationMemberStub.callCount).to.equal(13);
      expect(getOrg('federalist-users').length).to.equal(7);
    });

    it('should not remove a member if never logged in within 90 days of joining', async () => {
      const admin = await factory.user();

      await Promise.all(getOrg('federalist-users')
        .map(member => EventCreator.audit(Event.labels.FEDERALIST_USERS, User.build(), {
          action: 'member_added',
          membership: { user: { login: member.login } },
        })));

      expect(getOrg('federalist-users').length).to.equal(10);
      await FederalistUsersHelper.removeInactiveMembers({ auditorUsername: admin.username });
      expect(removeOrganizationMemberStub.callCount).to.equal(0);
      expect(getOrg('federalist-users').length).to.equal(10);
    });

    it('should remove a member if never logged in after 90 days of joining', async () => {
      const admin = await factory.user();

      const events = await Promise.all(getOrg('federalist-users')
        .map((member, index) => {
        if(index < 7) {
          return EventCreator.audit(Event.labels.FEDERALIST_USERS, User.build(), {
            action: 'member_added',
            membership: { user: { login: member.login } },
          });
        }
      }));

      const eventIds = events.slice(0,3).map(e => e.id);
      await sequelize.query(`UPDATE event set "createdAt" = '2000-01-01' where id in (${eventIds.join(',')});`);

      expect(getOrg('federalist-users').length).to.equal(10);
      await FederalistUsersHelper.removeInactiveMembers({ auditorUsername: admin.username });
      expect(removeOrganizationMemberStub.callCount).to.equal(6);
      expect(getOrg('federalist-users').length).to.equal(4);
    });

  });
});
