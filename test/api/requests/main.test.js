const { expect } = require('chai');
const request = require('supertest');

const app = require('../../../app');
const config = require('../../../config');
const { authenticatedSession } = require('../support/session');
const { sessionForCookie, sessionCookieFromResponse } = require('../support/cookieSession');

describe('Main Site', () => {
  describe('Home /', () => {
    const origFeatureAuthUAA = process.env.FEATURE_AUTH_UAA;

    beforeEach(() => {
      process.env.FEATURE_AUTH_UAA = false;
    });

    afterEach(() => {
      process.env.FEATURE_AUTH_UAA = origFeatureAuthUAA;
    });

    it('should work', () => {
      request(app)
        .get('/')
        .expect(200);
    });

    it('should redirect to /sites when authenticated', async () => {
      const cookie = await authenticatedSession();

      await request(app)
        .get('/')
        .set('Cookie', cookie)
        .expect(302)
        .expect('Location', '/sites');
    });
  });

  describe('App /404', () => {
    it('should redirect to / with a flash error when not authenticated', async () => {
      const response = await request(app)
        .get('/blahblahpage')
        .expect(404);

      expect(/Log in with (Github|cloud\.gov)/.test(response.text)).to.be.true;
      expect(response.text.indexOf('404 / Page not found')).to.be.above(-1);
    });

    it('should work when authenticated', async () => {
      const cookie = await authenticatedSession();
      const response = await request(app)
        .get('/blahblahpage')
        .set('Cookie', cookie)
        .expect(404);
      expect(response.text.indexOf('404 / Page not found')).to.be.above(-1);
    });
  });

  describe('options method', () => {
    it('should respond with a 404 for an options request without path', async () => {
      await request(app)
        .options('/')
        .expect(404);
    });

    it('should respond with a 404 for an options request with a path', async () => {
      await request(app)
        .options('/boo/hoo')
        .expect(404);
    });
  });
  describe('App /sites', () => {
    it('should redirect to / with a flash error when not authenticated', (done) => {
      request(app)
        .get('/sites')
        .expect(302)
        .then((response) => {
          expect(response.headers.location).to.equal('/');
          const cookie = sessionCookieFromResponse(response);
          return sessionForCookie(cookie);
        })
        .then((sess) => {
          expect(sess.flash.error.length).to.equal(1);
          expect(sess.flash.error[0]).to.equal(
            'You are not permitted to perform this action. Are you sure you are logged in?'
          );
          done();
        })
        .catch(done);
    });

    it('should work when authenticated', (done) => {
      authenticatedSession()
        .then(cookie => request(app)
          .get('/sites')
          .set('Cookie', cookie)
          .expect(200))
        .then(() => done());
    });

    it('should have app content', (done) => {
      authenticatedSession()
        .then(cookie => request(app)
          .get('/sites')
          .set('Cookie', cookie)
          .expect(200))
        .then((response) => {
          expect(response.text.indexOf('<div id="js-app" class="usa-grid"></div>')).to.be.above(-1);
          done();
        })
        .catch(done);
    });

    it('should contain references to built assets', (done) => {
      authenticatedSession()
        .then(cookie => request(app)
          .get('/sites')
          .set('Cookie', cookie)
          .expect(200))
        .then((response) => {
          const stylesBundleRe = /<link rel="stylesheet" href="\/\/dist\/styles\/styles\.css">/;
          expect(response.text.search(stylesBundleRe)).to.be.above(-1);

          const jsBundleRe = /<script src="\/\/dist\/js\/bundle\.js"><\/script>/;
          expect(response.text.search(jsBundleRe)).to.be.above(-1);
          done();
        })
        .catch(done);
    });

    it('should contain a csrfToken', (done) => {
      authenticatedSession()
        .then(cookie => request(app)
          .get('/sites')
          .set('Cookie', cookie)
          .expect(200))
        .then((response) => {
          const csrfTokenRe = /window.CSRF_TOKEN = "[a-z0-9_-]+";/i;
          expect(response.text.search(csrfTokenRe)).to.be.above(-1);
          done();
        })
        .catch(done);
    });

    it('should contain front end config values', (done) => {
      authenticatedSession()
        .then(cookie => request(app)
          .get('/sites')
          .set('Cookie', cookie)
          .expect(200))
        .then((response) => {
          expect(response.text.search('FRONTEND_CONFIG')).to.be.above(-1);
          expect(response.text.search('TEMPLATES')).to.be.above(-1);
          done();
        })
        .catch(done);
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
        authenticatedSession().then(cookie => request(app)
          .get('/sites')
          .set('Cookie', cookie))
          .then((response) => {
            expect(response.text).to.match(/usa-alert-warning/);
            expect(response.text).to.match(/Error message heading/);
            expect(response.text).to.match(/Error message body/);
            done();
          })
          .catch(done);
      });
    });

    context('when an error is not present', () => {
      describe('Without feature authUAA enabled', () => {
        beforeEach(() => {
          process.env.FEATURE_AUTH_UAA = false;
        });

        afterEach(() => {
          process.env.FEATURE_AUTH_UAA = false;
        });

        it('should not display a banner for authenticated users', (done) => {
          authenticatedSession().then(cookie => request(app)
            .get('/sites')
            .set('Cookie', cookie))
            .then((response) => {
              expect(response.text).to.not.match(/usa-alert-warning/);
              done();
            })
            .catch(done);
        });
      });

      it('should not display a banner for unauthenticated users', (done) => {
        request(app)
          .get('/site')
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
  it('denies robots when not in production', (done) => {
    config.app.appEnv = 'boop';

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
});
