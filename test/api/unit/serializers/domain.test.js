const { expect } = require('chai');
const validateJSONSchema = require('jsonschema').validate;

const domainSchema = require('../../../../public/swagger/Domain.json');
const DomainFactory = require('../../support/factory/domain');

const { Domain, Site } = require('../../../../api/models');
const DomainSerializer = require('../../../../api/serializers/domain');

function clean() {
  return Domain.truncate({
    force: true,
    cascade: true,
  });
}

describe('DomainSerializer', () => {
  beforeEach(clean);

  after(clean);

  describe('.serialize(serializable)', () => {
    it('should serialize an domain object correctly', async () => {
      const domain = await DomainFactory.create();

      const domainJson = DomainSerializer.serialize(domain);

      const result = validateJSONSchema(domainJson, domainSchema);

      expect(result.errors).to.be.empty;
      expect(domainJson.Site).to.be.undefined;
    });

    it('includes `Site` if present', async () => {
      const domain = await DomainFactory.create();
      const site = await domain.getSite();
      const domainWithSite = await domain.reload({
        include: [Site],
      });

      const domainJson = DomainSerializer.serialize(domainWithSite);

      expect(domainJson.Site.id).to.eq(site.id);
    });
  });

  describe('.serializeMany([serializable])', () => {
    it('should serialize an array of domain objects correctly', async () => {
      const arraySchema = {
        type: 'array',
        items: domainSchema,
      };
      const domains = await Promise.all([
        DomainFactory.create(),
        DomainFactory.create(),
        DomainFactory.create(),
      ]);

      const domainsJson = DomainSerializer.serializeMany(domains);

      const result = validateJSONSchema(domainsJson, arraySchema);
      expect(result.errors).to.be.empty;
    });
  });
});
