const { expect } = require('chai');
const validateJSONSchema = require('jsonschema').validate;

const roleSchema = require('../../../../public/swagger/Role.json');

const { Role } = require('../../../../api/models');
const RoleSerializer = require('../../../../api/serializers/role');

describe('RoleSerializer', () => {
  describe('.serialize(serializable)', () => {
    it('should serialize a role object correctly', async () => {
      const role = await Role.findOne({ where: { name: 'user' } });

      const roleJson = RoleSerializer.serialize(role);

      const result = validateJSONSchema(roleJson, roleSchema);
      expect(result.errors).to.be.empty;
    });
  });

  describe('.serializeMany([serializable])', () => {
    it('should serialize an array of role objects correctly', async () => {
      const arraySchema = {
        type: 'array',
        items: roleSchema,
      };
      const roles = await Role.findAll();

      const rolesJson = RoleSerializer.serializeMany(roles);

      const result = validateJSONSchema(rolesJson, arraySchema);
      expect(result.errors).to.be.empty;
    });
  });
});
