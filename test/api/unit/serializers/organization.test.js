const { expect } = require('chai');
const validateJSONSchema = require('jsonschema').validate;

const orgSchema = require('../../../../public/swagger/Organization.json');
const OrgFactory = require('../../support/factory/organization');

const { Organization } = require('../../../../api/models');
const OrganizationSerializer = require('../../../../api/serializers/organization');

function clean() {
  return Organization.truncate({ force: true, cascade: true });
}

describe('OrganizationSerializer', () => {
  beforeEach(clean);

  after(clean);

  describe('.serialize(serializable)', () => {
    it('should serialize an organization object correctly', async () => {
      const org = await OrgFactory.create();

      const orgJson = OrganizationSerializer.serialize(org);

      const result = validateJSONSchema(orgJson, orgSchema);
      expect(result.errors).to.be.empty;
    });
  });

  describe('.serializeMany([serializable])', () => {
    it('should serialize an array of organization objects correctly', async () => {
      const arraySchema = {
        type: 'array',
        items: orgSchema,
      };
      const orgs = await Promise.all([
        OrgFactory.create(),
        OrgFactory.create(),
        OrgFactory.create(),
      ]);

      const orgsJson = OrganizationSerializer.serializeMany(orgs);

      const result = validateJSONSchema(orgsJson, arraySchema);
      expect(result.errors).to.be.empty;
    });
  });
});
