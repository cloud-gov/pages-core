const expect = require('chai').expect;
const request = require('supertest');

const app = require('../../../app');
const config = require('../../../config');
const session = require('../support/session');
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

    context('<title> element', () => {
      const origAppEnv = config.app.app_env;

      after(() => {
        // reset config.app.app_env to its original value
        config.app.app_env = origAppEnv;
      });

      it('should display the app_env in the title element', (done) => {
        config.app.app_env = 'testing123';
        request(app)
          .get('/')
          .then((response) => {
            const titleRegex = /<title>\s*Federalist \| testing123\s*<\/title>/g;
            expect(response.text.search(titleRegex)).to.be.above(-1);
            done();
          })
          .catch(done);
      });

      it('should not display the app_env in the title when it is "production"', (done) => {
        config.app.app_env = 'production';
        request(app)
          .get('/')
          .then((response) => {
            const titleRegex = /<title>\s*Federalist\s*<\/title>/g;
            expect(response.text.search(titleRegex)).to.be.above(-1);
            done();
          })
          .catch(done);
      });
    });
  });

  describe('site wide error banner', () => {
    context('when an error is present', () => {
      beforeEach(() => {
        process.env.VCAP_SERVICES = JSON.stringify({
          'user-provided': [{
            credentials: { HEADING: 'Error message heading', BODY: 'Error message body' },
            name: 'federalist-site-wide-error',
          }],
        });
      });

      afterEach(() => {
        delete process.env.VCAP_SERVICES;
      });

      it('should display a banner for authenticated users', (done) => {
        session().then(cookie =>
          request(app)
            .get('/')
            .set('Cookie', cookie)
        )
        .then((response) => {
          expect(response.text).to.match(/usa-alert-warning/);
          expect(response.text).to.match(/Error message heading/);
          expect(response.text).to.match(/Error message body/);
          done();
        })
        .catch(done);
      });

      it('should not display a banner for unauthenticated users', (done) => {
        request(app)
          .get('/')
        .then((response) => {
          expect(response.text).to.not.match(/usa-alert-warning/);
          expect(response.text).to.not.match(/Error message heading/);
          expect(response.text).to.not.match(/Error message body/);
          done();
        })
        .catch(done);
      });
    });

    context('when an error is not present', () => {
      it('should not display a banner for authenticated users', (done) => {
        session().then(cookie =>
          request(app)
            .get('/')
            .set('Cookie', cookie)
        )
        .then((response) => {
          expect(response.text).to.not.match(/usa-alert-warning/);
          done();
        })
        .catch(done);
      });

      it('should not display a banner for unauthenticated users', (done) => {
        request(app)
          .get('/')
        .then((response) => {
          expect(response.text).to.not.match(/usa-alert-warning/);
          done();
        })
        .catch(done);
      });
    });
  });
});

describe('robots.txt', () => {
  const origAppConfig = Object.assign({}, config.app);

  after(() => {
    // reset config.app.app_env to its original value
    config.app = origAppConfig;
  });

  it('denies robots when not in production', (done) => {
    config.app.app_env = 'boop';

    request(app)
      .get('/robots.txt')
      .expect(200)
      .expect('Content-Type', 'text/plain; charset=utf-8')
      .then((response) => {
        expect(response.text).to.equal('User-Agent: *\nDisallow: /\n');
        done();
      })
      .catch(done);
  });

  it('denies robots when in production but non-production hostname', (done) => {
    config.app.app_env = 'production';
    config.app.hostname = 'http://prod-url.com';

    request(app)
      .get('/robots.txt')
      .set('host', 'non-prod-url.com')
      .expect(200)
      .expect('Content-Type', 'text/plain; charset=utf-8')
      .then((response) => {
        expect(response.text).to.equal('User-Agent: *\nDisallow: /\n');
        done();
      })
      .catch(done);
  });

  it('allows robots when in production and with production hostname', (done) => {
    config.app.app_env = 'production';
    config.app.hostname = 'http://prod-url.com';

    request(app)
      .get('/robots.txt')
      .set('host', 'prod-url.com')
      .expect(200)
      .expect('Content-Type', 'text/plain; charset=utf-8')
      .then((response) => {
        expect(response.text).to.equal('User-Agent: *\nDisallow: /preview\n');
        done();
      })
      .catch(done);
  });
});
