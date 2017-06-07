const expect = require('chai').expect;
const SiteWideErrorLoader = require('../../../../api/services/SiteWideErrorLoader');

describe('SiteWideErrorLoader', () => {
  describe('.loadSiteWideError()', () => {
    afterEach(() => {
      delete process.env.VCAP_SERVICES;
    });

    it('should load the site wide error', () => {
      process.env.VCAP_SERVICES = JSON.stringify({
        'user-provided': [{
          credentials: { DISPLAY: true, HEADING: 'Error message heading', BODY: 'Error message body' },
          name: 'federalist-site-wide-error',
        }],
      });

      const siteWideError = SiteWideErrorLoader.loadSiteWideError();
      expect(siteWideError.display).to.equal(true);
      expect(siteWideError.heading).to.equal('Error message heading');
      expect(siteWideError.body).to.equal('Error message body');
    });

    it('should return an empty error gracefully if no site wide error is present', () => {
      const siteWideError = SiteWideErrorLoader.loadSiteWideError();
      expect(siteWideError.display).to.equal(false);
      expect(siteWideError.heading).to.equal('');
      expect(siteWideError.body).to.equal('');
    });
  });
});
