const expect = require('chai').expect;
const SiteWideErrorLoader = require('../../../../api/services/SiteWideErrorLoader');

describe('SiteWideErrorLoader', () => {
  describe('.loadSiteWideError()', () => {
    afterEach(() => {
      delete process.env.VCAP_SERVICES;
    });

    it('should load the site wide error', () => {
      process.env.VCAP_SERVICES = JSON.stringify({
        'user-provided': [
          {
            credentials: {
              HEADING: 'Error message heading',
              BODY: 'Error message body',
            },
            name: 'federalist-site-wide-error',
          },
        ],
      });

      const siteWideError = SiteWideErrorLoader.loadSiteWideError();
      expect(siteWideError.heading).to.equal('Error message heading');
      expect(siteWideError.body).to.equal('Error message body');
    });

    it('should return null if no site wide error is present', () => {
      const siteWideError = SiteWideErrorLoader.loadSiteWideError();
      expect(siteWideError).to.equal(null);
    });

    it('should return null if the site wide error user provided service is empty', () => {
      process.env.VCAP_SERVICES = JSON.stringify({
        'user-provided': [
          {
            credentials: {
              HEADING: '',
              BODY: '',
            },
            name: 'federalist-site-wide-error',
          },
        ],
      });

      const siteWideError = SiteWideErrorLoader.loadSiteWideError();
      expect(siteWideError).to.equal(null);
    });
  });
});
