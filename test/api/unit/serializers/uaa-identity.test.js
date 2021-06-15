const { expect } = require('chai');
const validateJSONSchema = require('jsonschema').validate;
const uaaIdentitySchema = require('../../../../public/swagger/UAAIdentity.json');
const { buildUAAIdentity } = require('../../support/factory/uaa-identity');

const UAAIdentitySerializer = require('../../../../api/serializers/uaa-identity');

describe('UAAIdentitySerializer', () => {
  describe('.serialize(serializable)', () => {
    it('should serialize a uaa identity object correctly', async () => {
      const uaaIdentity = await buildUAAIdentity();

      const uaaIdentityJson = UAAIdentitySerializer.serialize(uaaIdentity);

      const result = validateJSONSchema(uaaIdentityJson, uaaIdentitySchema);
      expect(result.errors).to.be.empty;

      expect(uaaIdentityJson.uaaId).to.be.undefined;
    });

    it('should serialize an admin uaa identity object correctly', async () => {
      const uaaIdentity = await buildUAAIdentity();

      const uaaIdentityJson = UAAIdentitySerializer.serialize(uaaIdentity, true);

      const result = validateJSONSchema(uaaIdentityJson, uaaIdentitySchema);
      expect(result.errors).to.be.empty;

      expect(uaaIdentityJson.uaaId).to.eq(uaaIdentity.uaaId);
    });
  });

  describe('.serializeMany([serializable])', () => {
    it('should serialize an array of uaa identity objects correctly', async () => {
      const arraySchema = {
        type: 'array',
        items: uaaIdentitySchema,
      };

      const uaaIdentities = await Promise.all([
        buildUAAIdentity(),
        buildUAAIdentity(),
      ]);

      const uaaIdentitiesJson = UAAIdentitySerializer.serializeMany(uaaIdentities);

      const result = validateJSONSchema(uaaIdentitiesJson, arraySchema);
      expect(result.errors).to.be.empty;
    });
  });
});
