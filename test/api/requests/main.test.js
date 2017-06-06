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
          const cssBundleRe = /<link rel="stylesheet" href="\/styles\/styles\.[a-z0-9]*\.css">/;
          expect(response.text.search(cssBundleRe)).to.be.above(-1);

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
  });
});
