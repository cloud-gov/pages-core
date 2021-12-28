const { expect, assert } = require('chai');
const validateJSONSchema = require('jsonschema').validate;

const siteSchema = require('../../../../public/swagger/Site.json');
const factory = require('../../support/factory');
const { Domain, Site } = require('../../../../api/models');

const SiteSerializer = require('../../../../api/serializers/site');

describe('SiteSerializer', () => {
  describe('.serialize(serializable)', () => {
    it('should serialize an object correctly', (done) => {
      factory.site({ basicAuth: { username: 'username', password: 'password' } })
        .then(site => SiteSerializer.serialize(site))
        .then((object) => {
          const result = validateJSONSchema(object, siteSchema);
          expect(result.errors).to.be.empty;
          expect(object.basicAuth.password).to.eq('**********'); // hide password check
          done();
        })
        .catch(done);
    });

    it('should serialize an array correctly', (done) => {
      const sites = Array(3).fill(0).map(() => factory.site());

      Promise.all(sites)
        .then(SiteSerializer.serialize)
        .then((object) => {
          const arraySchema = {
            type: 'array',
            items: siteSchema,
          };
          const result = validateJSONSchema(object, arraySchema);
          expect(result.errors).to.be.empty;
          done();
        })
        .catch(done);
    });

    it('excludes users without a federalist account', (done) => {
      const authUserCount = 3;
      const nonGithubUser = factory.user({ githubAccessToken: null });
      const otherUsers = Array(authUserCount).fill(0).map(() => factory.user());

      Promise.all(otherUsers.concat(nonGithubUser))
        .then(users => factory.site({ users }))
        .then(SiteSerializer.serialize)
        .then((object) => {
          expect(object.users.length).to.equal(authUserCount);
          done();
        })
        .catch(done);
    });

    it('includes organization name when associated to site', async () => {
      const site = await factory.site({ basicAuth: { username: 'username', password: 'password' } });
      const org = await factory.organization.create();
      await org.addSite(site.id);
      await site.reload();
      const object = await SiteSerializer.serialize(site);

      const result = validateJSONSchema(object, siteSchema);
      expect(result.errors).to.be.empty;
      expect(object.basicAuth.password).to.eq('**********');
      expect(object.organizationId).to.equal(org.id);
    });

    it('includes URL editability when associated to domain', async () => {
      const site = await factory.site({ domain: 'https://www.agency.gov', demoDomain: null });
      const domain = await factory.domain.create({ siteId: site.id, names: 'www.agency.gov', context: "site" });
      await site.reload({ include: [ Domain ] });
      const object = await SiteSerializer.serializeObject(site);

      const result = validateJSONSchema(object, siteSchema);
      expect(result.errors).to.be.empty;

      expect(object.canEditLiveUrl).to.equal(false); // Because there is an associated site domain with a non-conflicting URL
      expect(object.canEditDemoUrl).to.equal(false); // Because the demo domain is null
    });
  });

  describe('.serializeNew(serializable)', () => {
    it('should serialize an object correctly', async () => {
      const site = await factory.site({ basicAuth: { username: 'username', password: 'password' } });

      const serialized = SiteSerializer.serializeNew(site);

      const result = validateJSONSchema(serialized, siteSchema);
      expect(result.errors).to.be.empty;
      expect(serialized.basicAuth.password).to.eql('**********'); // hide password check
      expect(serialized.users).to.be.undefined; // does not query for users by default
      expect(serialized.containerConfig).to.be.undefined;
    });

    it('includes admin attributes', async () => {
      const containerConfig = { name: 'name', size: 'size' };
      const site = await factory.site({ containerConfig });

      const serialized = SiteSerializer.serializeNew(site, true);

      const result = validateJSONSchema(serialized, siteSchema);
      expect(result.errors).to.be.empty;
      expect(serialized.basicAuth).to.eql({});
      expect(serialized.users).to.be.undefined; // does not query for users by default
      expect(serialized.containerConfig).to.deep.eq(containerConfig);
    });
  });
});
