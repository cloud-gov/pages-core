const { expect } = require('chai');
const nock = require('nock');
const request = require('supertest');
const app = require('../../../app');
const factory = require('../support/factory');
const githubAPINocks = require('../support/githubAPINocks');
const {
  adminAuthenticatedSession,
  adminUnauthenticatedSession,
  unauthenticatedSession,
} = require('../support/session');
const { sessionForCookie } = require('../support/cookieSession');
const { User } = require('../../../api/models');

describe('Admin authentication request', () => {
  afterEach(() => nock.cleanAll());

  describe('GET /admin/auth/github', () => {
    it('should redirect to GitHub for OAuth2 authentication', (done) => {
      request(app)
        .get('/admin/auth/github')
        .expect('Location', /^https:\/\/github.com\/login\/oauth\/authorize.*/)
        .expect(302, done);
    });

    it('should redirect to the root URL if the admin is logged in', (done) => {
      adminAuthenticatedSession().then((cookie) => {
        request(app)
          .get('/admin/auth/github')
          .set('Cookie', cookie)
          .expect('Location', 'http://localhost:4000')
          .expect(302, done);
      });
    });
  });

  describe('GET /admin/logout', () => {
    it('should de-authenticate and remove the admin from the session', (done) => {
      let user;
      let cookie;

      const userPromise = factory.user();
      const sessionPromise = adminAuthenticatedSession(userPromise);

      Promise.props({
        user: userPromise,
        cookie: sessionPromise,
      })
        .then((results) => {
          ({ user, cookie } = results);
          return sessionForCookie(cookie);
        })
        .then((authSession) => {
          expect(authSession.adminAuthenticated).to.be.equal(true);
          expect(authSession.passport.user).to.equal(user.id);

          return request(app)
            .get('/admin/logout')
            .set('Cookie', cookie)
            .expect('Location', 'http://localhost:4000')
            .expect(302);
        })
        .then(() => sessionForCookie(cookie))
        .then((nonAuthSession) => {
          expect(nonAuthSession).to.equal(null);
          done();
        })
        .catch(done);
    });

    it('should redirect to the root URL for an unauthenticated user', (done) => {
      request(app)
        .get('/admin/logout')
        .expect('Location', 'http://localhost:4000')
        .expect(302, done);
    });
  });

  describe('GET /admin/auth/github/callback', () => {
    context('when the admin exists in the database', () => {
      it('should authenticate the user', (done) => {
        let user;
        let cookie;
        nock.cleanAll();
        const oauthState = 'state-123abc';
        factory.user().then((model) => {
          user = model;
          return githubAPINocks.githubAdminAuth(user.username);
        })
          .then(() => adminUnauthenticatedSession({ oauthState }))
          .then((session) => {
            cookie = session;
            return request(app)
              .get(`/admin/auth/github/callback?code=auth-code-123abc&state=${oauthState}`)
              .set('Cookie', cookie)
              .expect(302);
          })
          .then(() => sessionForCookie(cookie))
          .then((authSession) => {
            expect(authSession.adminAuthenticated).to.equal(true);
            expect(authSession.passport.user).to.equal(user.id);
            done();
          })
          .catch(done);
      });

      it('should not create a new admin that exist', (done) => {
        let userCount;
        const oauthState = 'state-123abc';
        factory.user()
          .then((user) => {
            githubAPINocks.githubAdminAuth(user.username);
            return User.count();
          })
          .then((count) => {
            userCount = count;
            return adminUnauthenticatedSession({ oauthState });
          })
          .then(cookie => request(app)
            .get(`/admin/auth/github/callback?code=auth-code-123abc&state=${oauthState}`)
            .set('Cookie', cookie)
            .expect(302))
          .then(() => User.count())
          .then((count) => {
            expect(count).to.equal(userCount);
            done();
          })
          .catch(done);
      });

      it("should update the user's GitHub access token and test auth for uppercased named github user", (done) => {
        let user;
        const oauthState = 'state-123abc';

        factory.user()
          .then((model) => {
            user = model;
            expect(user.githubAccessToken).not.to.equal('access-token-123abc');

            githubAPINocks.githubAdminAuth(user.username.toUpperCase());

            return adminUnauthenticatedSession({ oauthState });
          })
          .then(cookie => request(app)
            .get(`/admin/auth/github/callback?code=auth-code-123abc&state=${oauthState}`)
            .set('Cookie', cookie)
            .expect(302))
          .then(() => User.findByPk(user.id))
          .then((foundUser) => {
            expect(foundUser.githubAccessToken).to.equal('access-token-123abc');
            done();
          })
          .catch(done);
      });
    });

    context('when the admin user does not exist in the database', () => {
      it('should not create and authenticate the user', (done) => {
        let cookie;
        const oauthState = 'state-123abc';
        const githubUserID = Math.floor(Math.random() * 10000);
        nock.cleanAll();
        githubAPINocks.getAccessToken();
        githubAPINocks.user({ githubUserID });
        githubAPINocks.userOrganizations();

        unauthenticatedSession({ oauthState })
          .then((session) => {
            cookie = session;
            return request(app)
              .get(`/admin/auth/github/callback?code=auth-code-123abc&state=${oauthState}`)
              .set('Cookie', cookie)
              .expect(302);
          })
          .then(() => sessionForCookie(cookie))
          .then((authSession) => {
            expect(authSession.adminAuthenticated).to.equal(undefined);
            return User.findByPk(githubUserID);
          })
          .then((user) => {
            expect(user).to.be.null;
            done();
          })
          .catch(done);
      });
    });
  });
});
