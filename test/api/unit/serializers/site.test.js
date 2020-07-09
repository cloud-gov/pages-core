const { expect } = require('chai');
const validateJSONSchema = require('jsonschema').validate;

const siteSchema = require('../../../../public/swagger/Site.json');
const factory = require('../../support/factory');

const SiteSerializer = require('../../../../api/serializers/site');

describe('SiteSerializer', () => {
  describe('.serialize(serializable)', () => {
    it('should serialize an object correctly', (done) => {
      factory.site()
        .then(site => SiteSerializer.serialize(site))
        .then((object) => {
          const result = validateJSONSchema(object, siteSchema);
          expect(result.errors).to.be.empty;
          expect(object.config).to.be.undefined;
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
  });
});
