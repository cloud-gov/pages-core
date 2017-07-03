const expect = require('chai').expect;
const validateJSONSchema = require('jsonschema').validate;

const siteSchema = require('../../../../public/swagger/Site.json');
const factory = require('../../support/factory');

const SiteSerializer = require('../../../../api/serializers/site');

const badUrl = 'javascript:alert("hi")'; // eslint-disable-line no-script-url

describe('SiteSerializer', () => {
  describe('.serialize(serializable)', () => {
    it('should serialize an object correctly', (done) => {
      factory.site()
        .then(site => SiteSerializer.serialize(site))
        .then((object) => {
          const result = validateJSONSchema(object, siteSchema);
          expect(result.errors).to.be.empty;
          done();
        })
        .catch(done);
    });

    it('should not include invalid domain or viewLink', (done) => {
      factory.site()
        .then((s) => {
          s.domain = badUrl; // eslint-disable-line no-param-reassign
          return SiteSerializer.serialize(s);
        })
        .then((object) => {
          expect(object.domain).to.be.empty;
          expect(object.viewLink.indexOf(badUrl)).to.equal(-1);
          done();
        })
        .catch(done);
    });

    it('should not include invalid demoDomain or demoViewLink', (done) => {
      factory.site({ demoBranch: 'demo-branch' })
        .then((s) => {
          s.demoDomain = badUrl; // eslint-disable-line no-param-reassign
          return SiteSerializer.serialize(s);
        })
        .then((object) => {
          expect(object.demoDomain).to.be.empty;
          expect(object.demoViewLink.indexOf(badUrl)).to.equal(-1);
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
  });
});
