const { expect } = require('chai');
const { Validator } = require('jsonschema');

const orgRoleSchema = require('../../../../public/swagger/OrganizationRole.json');
const orgSchema = require('../../../../public/swagger/Organization.json');
const roleSchema = require('../../../../public/swagger/Role.json');
const userSchema = require('../../../../public/swagger/User.json');
const OrgFactory = require('../../support/factory/organization');
const createUser = require('../../support/factory/user');

const { OrganizationRole, Role } = require('../../../../api/models');
const OrganizationRoleSerializer = require('../../../../api/serializers/organization-role');

function clean() {
  return OrganizationRole.truncate({ force: true, cascade: true });
}

const v = new Validator();
v.addSchema(orgSchema, '/Organization.json');
v.addSchema(roleSchema, '/Role.json');
v.addSchema(userSchema, '/User.json');

describe('OrganizationRoleSerializer', () => {
  beforeEach(clean);

  after(clean);

  describe('.serialize(serializable)', () => {
    it('should serialize an organization-role object correctly', async () => {
      const [org, role, user] = await Promise.all([
        OrgFactory.create(),
        Role.findOne({ where: { name: 'user' } }),
        createUser(),
      ]);

      const orgRole = await OrganizationRole.create({
        organizationId: org.id,
        roleId: role.id,
        userId: user.id,
      });

      const orgRoleJson = OrganizationRoleSerializer.serialize(orgRole);

      const result = v.validate(orgRoleJson, orgRoleSchema);
      expect(result.errors).to.be.empty;
    });

    it('should serialize an organization-role object with org and role correctly', async () => {
      const [org, role, user] = await Promise.all([
        OrgFactory.create(),
        Role.findOne({ where: { name: 'user' } }),
        createUser(),
      ]);

      await OrganizationRole.create({
        organizationId: org.id,
        roleId: role.id,
        userId: user.id,
      });

      const orgRole = await OrganizationRole.forUser(user)
        .findOne({ where: { organizationId: org.id } });

      expect(orgRole.Organization.id).to.eq(org.id);
      expect(orgRole.Role.id).to.eq(role.id);

      const orgRoleJson = OrganizationRoleSerializer.serialize(orgRole);

      const result = v.validate(orgRoleJson, orgRoleSchema);
      expect(result.errors).to.be.empty;
    });
  });

  describe('.serializeMany([serializable])', () => {
    it('should serialize an array of organization-role objects correctly', async () => {
      const arraySchema = {
        type: 'array',
        items: orgRoleSchema,
      };

      const [org, role, user1, user2] = await Promise.all([
        OrgFactory.create(),
        Role.findOne({ where: { name: 'user' } }),
        createUser(),
        createUser(),
      ]);

      const orgRoles = await Promise.all([
        OrganizationRole.create({
          organizationId: org.id,
          roleId: role.id,
          userId: user1.id,
        }),
        OrganizationRole.create({
          organizationId: org.id,
          roleId: role.id,
          userId: user2.id,
        }),
      ]);

      const orgRolesJson = OrganizationRoleSerializer.serializeMany(orgRoles);

      const result = v.validate(orgRolesJson, arraySchema);
      expect(result.errors).to.be.empty;
    });
  });
});
