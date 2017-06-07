const expect = require('chai').expect;
const request = require('supertest-as-promised');

const app = require('../../../app');
const factory = require('../support/factory');

describe('Main Site', () => {
  describe('GET /', () => {
    it('should work', () => {
      factory.build().then(() => request(app)
          .get('/')
          .expect(200));
    });

    it('should contain references to built assets', (done) => {
      factory.build().then(() => request(app)
          .get('/')
          .expect(200))
        .then((response) => {
          const stylesBundleRe = /<link rel="stylesheet" href="\/styles\/styles\.[a-z0-9]*\.css">/;
          expect(response.text.search(stylesBundleRe)).to.be.above(-1);

          const jsBundleRe = /<script src="\/js\/bundle\.[a-z0-9]*\.js"><\/script>/;
          expect(response.text.search(jsBundleRe)).to.be.above(-1);
          done();
        })
        .catch(done);
    });

    it('should include a cache-control header', (done) => {
      request(app)
        .get('/')
      .then((response) => {
        expect(response.headers).to.have.property('cache-control', 'max-age=0');
        done();
      })
      .catch(done);
    });

    it('should render a site wide error if one is present', (done) => {
      after(() => {
        delete process.env.VCAP_SERVICES;
      });

      process.env.VCAP_SERVICES = JSON.stringify({
        'user-provided': [{
          credentials: { DISPLAY: true, HEADING: 'Error message heading', BODY: 'Error message body' },
          name: 'federalist-site-wide-error',
        }],
      });

      request(app)
        .get('/')
      .then((response) => {
        expect(response.text).to.match(/Error message heading/);
        expect(response.text).to.match(/Error message body/);
        done();
      })
      .catch(done);
    });
  });
});
