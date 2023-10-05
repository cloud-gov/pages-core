const { expect } = require('chai');
const moment = require('moment');
const {
  Role, Site, Organization, OrganizationRole, User,
} = require('../../../../api/models');
const { sandboxDays } = require('../../../../config').app;

const orgFactory = require('../../support/factory/organization');
const createSite = require('../../support/factory/site');
const createUser = require('../../support/factory/user');

function clean() {
  return Promise.all([
    Organization.truncate({ force: true, cascade: true }),
    OrganizationRole.truncate({ force: true, cascade: true }),
    Site.truncate({ force: true, cascade: true }),
    User.truncate({ force: true, cascade: true }),
  ]);
}

describe('Organization model', () => {
  let userRole;
  let managerRole;

  before(async () => {
    await clean();
    [userRole, managerRole] = await Promise.all([
      Role.findOne({ where: { name: 'user' } }),
      Role.findOne({ where: { name: 'manager' } }),
    ]);
  });

  afterEach(clean);

  it('`name` is required', async () => {
    const error = await Organization.create({}).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeValidationError');
  });

  it('`name` is unique', async () => {
    const name = 'name';
    await Organization.create({ name });

    const error = await Organization.create({ name }).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeUniqueConstraintError');
  });

  describe('isSelfAuthorized', () => {
    it('is true when `selfAuthorizedAt` is present', () => {
      const org = Organization.build({ name: 'foo', selfAuthorizedAt: new Date() });
      expect(org.isSelfAuthorized).to.be.true;
    });

    it('is false when `selfAuthorizedAt` is absent', () => {
      const org = Organization.build({ name: 'foo' });
      expect(org.isSelfAuthorized).to.be.false;
    });
  });

  describe('isSelfAuthorized(true)', () => {
    describe('when `selfAuthorizedAt` is absent', () => {
      const org = Organization.build({ name: 'foo' });

      it('sets `selfAuthorizedAt` to the current date', () => {
        const before = new Date();

        expect(org.selfAuthorizedAt).to.be.undefined;
        org.isSelfAuthorized = true;
        expect(org.selfAuthorizedAt).to.be.within(before, new Date());
      });
    });

    describe('when `selfAuthorizedAt` is present', () => {
      const selfAuthorizedAt = new Date();
      const org = Organization.build({ name: 'foo', selfAuthorizedAt });

      it('does nothing', () => {
        expect(org.selfAuthorizedAt).to.eq(selfAuthorizedAt);
        org.isSelfAuthorized = true;
        expect(org.selfAuthorizedAt).to.eq(selfAuthorizedAt);
      });
    });

    describe('isSelfAuthorized(false)', () => {
      describe('when `selfAuthorizedAt` is absent', () => {
        const org = Organization.build({ name: 'foo' });

        it('does nothing', () => {
          expect(org.selfAuthorizedAt).to.be.undefined;
          org.isSelfAuthorized = false;
          expect(org.selfAuthorizedAt).to.be.undefined;
        });
      });

      describe('when `selfAuthorizedAt` is present', () => {
        const selfAuthorizedAt = new Date();
        const org = Organization.build({ name: 'foo', selfAuthorizedAt });

        it('sets `selfAuthorizedAt` to null', () => {
          expect(org.selfAuthorizedAt).to.eq(selfAuthorizedAt);
          org.isSelfAuthorized = false;
          expect(org.selfAuthorizedAt).to.be.null;
        });
      });
    });
  });

  it('can have many users', async () => {
    const [org, user1, user2] = await Promise.all([
      orgFactory.create(),
      createUser(),
      createUser(),
    ]);

    expect(await org.hasUser(user1)).to.be.false;
    expect(await org.hasUser(user2)).to.be.false;

    await Promise.all([
      org.addUser(user1, { through: { roleId: userRole.id } }),
      org.addUser(user2, { through: { roleId: userRole.id } }),
    ]);

    expect(await org.hasUser(user1)).to.be.true;
    expect(await org.hasUser(user2)).to.be.true;
  });

  it('can only have one role for a user', async () => {
    const [org, user] = await Promise.all([
      orgFactory.create(),
      createUser(),
    ]);

    expect(await org.hasUser(user)).to.be.false;

    await org.addUser(user, { through: { roleId: userRole.id } });

    expect(await org.hasUser(user)).to.be.true;

    [userRole, managerRole].forEach(async (role) => {
      const error = await org.addUser(user, { through: { roleId: role.id } }).catch(e => e);
      expect(error).to.be.an('error');
      expect(error.name).to.eq('SequelizeUniqueConstraintError');
    });
  });

  it('can have many sites', async () => {
    const [org, site1, site2] = await Promise.all([
      orgFactory.create(),
      createSite(),
      createSite(),
    ]);

    expect(await org.hasSite(site1)).to.be.false;
    expect(await org.hasSite(site2)).to.be.false;

    await Promise.all([
      org.addSite(site1),
      org.addSite(site2),
    ]);

    expect(await org.hasSite(site1)).to.be.true;
    expect(await org.hasSite(site2)).to.be.true;
  });

  it('can only have a site once', async () => {
    const [org, site] = await Promise.all([
      orgFactory.create(),
      createSite(),
    ]);
    await org.addSite(site);
    const numSites = await org.countSites();

    await org.addSite(site);

    expect(await org.countSites()).to.eq(numSites);
  });

  describe('searchScope', () => {
    it('returns the org by id.', async () => {
      const [org1] = await Promise.all([
        orgFactory.create(),
        orgFactory.create(),
      ]);

      const orgs = await Organization.scope(Organization.searchScope(org1.id)).findAll();

      expect(orgs.length).to.eq(1);
      expect(orgs[0].id).to.eq(org1.id);
    });

    it('returns the org by name substring.', async () => {
      const [, org2] = await Promise.all([
        orgFactory.create(),
        orgFactory.create(),
      ]);

      const orgs = await Organization.scope(Organization.searchScope(org2.name)).findAll();

      expect(orgs.length).to.eq(1);
      expect(orgs[0].id).to.eq(org2.id);
    });
  });

  describe('.byName()', () => {
    it('returns organizations ordered by name', async () => {
      const orgB = Organization.create({ name: 'Org B' });
      const orgA = Organization.create({ name: 'Org A' });
      const orgC = Organization.create({ name: 'Org C' });
      const result = await Organization.scope('byName').findAll();
      expect(result.map((org) => org.id)).to.include.ordered.members([
        orgA.id,
        orgB.id,
        orgC.id,
      ]);
    });
  });

  describe('forUser', () => {
    it('returns all orgs for the user and includes the `OrganizationRole` and `User`.', async () => {
      const [user, org1, org2] = await Promise.all([
        createUser(),
        orgFactory.create(),
        orgFactory.create(),
        orgFactory.create(),
      ]);

      await user.addOrganization(org1, { through: { roleId: userRole.id } });
      await user.addOrganization(org2, { through: { roleId: managerRole.id } });

      const orgs = await Organization.forUser(user).findAll();

      expect(orgs.length).to.eq(2);
      expect(orgs.map(org => org.id)).to.have.members([org1.id, org2.id]);
      expect(orgs.flatMap(org => org.Users.map(u => u.id))).to.have.members([user.id, user.id]);
      expect(orgs.flatMap(org => org.OrganizationRoles.map(or => or.userId)))
        .to.have.members([user.id, user.id]);
    });
  });

  describe('forManagerRole', () => {
    it('returns only orgs for which user is a manager and includes the `OrganizationRole` and `Role`.', async () => {
      const [user, org1, org2] = await Promise.all([
        createUser(),
        orgFactory.create(),
        orgFactory.create(),
      ]);

      await user.addOrganization(org1, { through: { roleId: userRole.id } });
      await user.addOrganization(org2, { through: { roleId: managerRole.id } });

      const orgs = await Organization.forManagerRole(user).findAll();

      expect(orgs.length).to.eq(1);
      expect(orgs[0].OrganizationRoles.length).to.eq(1);
      expect(orgs[0].OrganizationRoles[0].userId).to.eq(user.id);
      expect(orgs[0].OrganizationRoles[0].Role.id).to.eq(managerRole.id);
    });
  });

  describe('daysUntilSandboxCleaning', () => {
    it('sandboxNextCleaningAt is defined', async () => {
      const org = await orgFactory.create({
        isSandbox: true,
        sandboxNextCleaningAt: moment().add(1, 'day').toDate(),
      });
      expect(org.daysUntilSandboxCleaning).to.equal(1);
    });

    it('sandboxNextCleaningAt is defined for non-sandbox org', async () => {
      const org = await orgFactory.create({
        isSandbox: false,
        sandboxNextCleaningAt: moment().add(1, 'day').toDate(),
      });
      expect(org.sandboxNextCleaningAt).to.be.null;
      expect(org.daysUntilSandboxCleaning).to.be.null;
    });

    it('sandboxNextCleaningAt is not defined for non-sandbox org', async () => {
      const org = await orgFactory.create({
        isSandbox: false,
        sandboxNextCleaningAt: null,
      });
      expect(org.sandboxNextCleaningAt).to.be.null;
      expect(org.daysUntilSandboxCleaning).to.be.null;
    });

    it('sandboxNextCleaningAt is not defined for sandbox org', async () => {
      const org = await orgFactory.create({
        isSandbox: true,
        sandboxNextCleaningAt: null,
      });
      expect(org.sandboxNextCleaningAt).to.eql(moment().add(sandboxDays, 'days').endOf('day').toDate());
      expect(org.daysUntilSandboxCleaning).to.equal(sandboxDays);
    });
  });
});
