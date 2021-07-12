const { expect } = require('chai');
const {
  Role, Organization, OrganizationRole, User, UAAIdentity,
} = require('../../../../api/models');

const orgFactory = require('../../support/factory/organization');
const { createUAAIdentity } = require('../../support/factory/uaa-identity');
const createUser = require('../../support/factory/user');

function clean() {
  return Promise.all([
    Organization.truncate({ force: true, cascade: true }),
    OrganizationRole.truncate({ force: true, cascade: true }),
    User.truncate({ force: true, cascade: true }),
    UAAIdentity.truncate({ force: true, cascade: true }),
  ]);
}

let userRole;

describe('Organization Role model', () => {
  before(async () => {
    userRole = await Role.findOne({ where: { name: 'user' } });
  });

  beforeEach(clean);

  after(clean);

  describe('requires', () => {
    let org;
    let user;

    before(async () => {
      [org, user] = await Promise.all([
        orgFactory.create(),
        createUser(),
      ]);
    });

    it('`organization` to be present', async () => {
      const error = await OrganizationRole.create({ roleId: userRole.id, userId: user.id })
        .catch(e => e);

      expect(error).to.be.an('error');
      expect(error.name).to.eq('SequelizeDatabaseError');
    });

    it('`role` to be present', async () => {
      const error = await OrganizationRole.create({ organizationId: org.id, userId: user.id })
        .catch(e => e);

      expect(error).to.be.an('error');
      expect(error.name).to.eq('SequelizeDatabaseError');
    });

    it('`user` to be present', async () => {
      const error = await OrganizationRole.create({ organizationId: org.id, roleId: userRole.id })
        .catch(e => e);

      expect(error).to.be.an('error');
      expect(error.name).to.eq('SequelizeDatabaseError');
    });
  });

  describe('forOrganization', () => {
    it('returns all roles for the organization and includes the `Role`, `User`, and `UAAIdentity`.', async () => {
      const [
        org1,
        org2,
        user1,
        user2,
      ] = await Promise.all([
        orgFactory.create(),
        orgFactory.create(),
        createUser(),
        createUser(),
      ]);

      const [uaa1, uaa2] = await Promise.all([
        createUAAIdentity({ userId: user1.id }),
        createUAAIdentity({ userId: user2.id }),
        org1.addUser(user1, { through: { roleId: userRole.id } }),
        org1.addUser(user2, { through: { roleId: userRole.id } }),
        org2.addUser(user1, { through: { roleId: userRole.id } }),
      ]);

      const orgRoles = await OrganizationRole.forOrganization(org1).findAll();

      expect(orgRoles.map(orgRole => orgRole.organizationId)).to.have.members([org1.id, org1.id]);
      expect(orgRoles.map(orgRole => orgRole.Role.id)).to.have.members([userRole.id, userRole.id]);
      expect(orgRoles.map(orgRole => orgRole.User.id)).to.have.members([user1.id, user2.id]);
      expect(orgRoles.map(orgRole => orgRole.User.UAAIdentity.id))
        .to.have.members([uaa1.id, uaa2.id]);
    });
  });

  describe('forUser', () => {
    it('returns all roles for the user and includes the `Organization` and `Role`.', async () => {
      const [
        org1,
        org2,
        user1,
        user2,
      ] = await Promise.all([
        orgFactory.create(),
        orgFactory.create(),
        createUser(),
        createUser(),
      ]);

      await Promise.all([
        org1.addUser(user1, { through: { roleId: userRole.id } }),
        org1.addUser(user2, { through: { roleId: userRole.id } }),
        org2.addUser(user1, { through: { roleId: userRole.id } }),
      ]);

      const orgRoles = await OrganizationRole.forUser(user1).findAll();

      expect(orgRoles.map(orgRole => orgRole.Organization.id)).to.have.members([org1.id, org2.id]);
      expect(orgRoles.map(orgRole => orgRole.Role.id)).to.have.members([userRole.id, userRole.id]);
      expect(orgRoles.map(orgRole => orgRole.userId)).to.have.members([user1.id, user1.id]);
    });
  });
});
