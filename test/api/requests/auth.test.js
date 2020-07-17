const { expect } = require('chai');
const nock = require('nock');
const request = require('supertest');
const app = require('../../../app');
const config = require('../../../config');
const factory = require('../support/factory');
const githubAPINocks = require('../support/githubAPINocks');
const { authenticatedSession, unauthenticatedSession } = require('../support/session');
const { sessionForCookie } = require('../support/cookieSession');
const { User } = require('../../../api/models');

describe('Authentication request', () => {
  describe('GET /auth/github', () => {
    it('should redirect to GitHub for OAuth2 authentication', (done) => {
      request(app)
        .get('/auth/github')
        .expect('Location', /^https:\/\/github.com\/login\/oauth\/authorize.*/)
        .expect(302, done);
    });

    it('should redirect to the root URL if the users is logged in', (done) => {
      authenticatedSession().then((cookie) => {
        request(app)
          .get('/auth/github')
          .set('Cookie', cookie)
          .expect('Location', 'http://localhost:4000')
          .expect(302, done);
      });
    });
  });

  describe('GET /logout', () => {
    it('should de-authenticate and remove the user from the session', (done) => {
      let user;
      let cookie;

      const userPromise = factory.user();
      const sessionPromise = authenticatedSession(userPromise);

      Promise.props({
        user: userPromise,
        cookie: sessionPromise,
      }).then((results) => {
        user = results.user;
        cookie = results.cookie;
        return sessionForCookie(cookie);
      }).then((authSession) => {
        expect(authSession.authenticated).to.be.equal(true);
        expect(authSession.passport.user).to.equal(user.id);

        return request(app)
          .get('/logout')
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
        .get('/logout')
        .expect('Location', 'http://localhost:4000')
        .expect(302, done);
    });
  });

  describe('GET /auth/github/callback', () => {
    context('when the user exists in the database', () => {
      it('should authenticate the user', (done) => {
        let user;
        let cookie;
        nock.cleanAll();
        const oauthState = 'state-123abc';
        factory.user().then((model) => {
          user = model;
          return githubAPINocks.githubAuth(user.username, [{ id: 123456 }]);
        })
          .then(() => unauthenticatedSession({ oauthState }))
          .then((session) => {
            cookie = session;
            return request(app)
              .get(`/auth/github/callback?code=auth-code-123abc&state=${oauthState}`)
              .set('Cookie', cookie)
              .expect(302);
          })
          .then(() => sessionForCookie(cookie))
          .then((authSession) => {
            expect(authSession.authenticated).to.equal(true);
            expect(authSession.passport.user).to.equal(user.id);
            done();
          })
          .catch(done);
      });

      it('should not create a new user', (done) => {
        let userCount;
        const oauthState = 'state-123abc';
        factory.user()
          .then((user) => {
            githubAPINocks.githubAuth(user.username, [{ id: 123456 }]);
            return User.count();
          })
          .then((count) => {
            userCount = count;
            return unauthenticatedSession({ oauthState });
          })
          .then(cookie => request(app)
            .get(`/auth/github/callback?code=auth-code-123abc&state=${oauthState}`)
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

            githubAPINocks.githubAuth(user.username.toUpperCase(), [{ id: 123456 }]);

            return unauthenticatedSession({ oauthState });
          }).then(cookie => request(app)
            .get(`/auth/github/callback?code=auth-code-123abc&state=${oauthState}`)
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

    context('when the user does not exist in the database', () => {
      it('should create and authenticate the user', (done) => {
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
              .get(`/auth/github/callback?code=auth-code-123abc&state=${oauthState}`)
              .set('Cookie', cookie)
              .expect(302);
          }).then(() => sessionForCookie(cookie))
          .then((authSession) => {
            expect(authSession.authenticated).to.equal(true);
            const userID = authSession.passport.user;
            return User.findByPk(userID);
          })
          .then((user) => {
            expect(user).to.have.property('email', `user-${githubUserID}@example.com`);
            expect(user).to.have.property('username', `user-${githubUserID}`);
            expect(user).to.have.property('githubUserId', `${githubUserID}`);
            expect(user).to.have.property('githubAccessToken', 'access-token-123abc');
            done();
          })
          .catch(done);
      });
    });

    it('should redirect to the home page with a flash error if the authorization code is invalid', (done) => {
      let cookie;
      const oauthState = 'state-123abc';
      nock('https://github.com')
        .post('/login/oauth/access_token', {
          client_id: config.passport.github.options.clientID,
          client_secret: config.passport.github.options.clientSecret,
          code: 'invalid-code',
        })
        .reply(401);
      unauthenticatedSession({ oauthState })
        .then((session) => {
          cookie = session;
          return request(app)
            .get(`/auth/github/callback?code=invalid-code&state=${oauthState}`)
            .set('Cookie', cookie);
        })
        .then((response) => {
          expect(response.statusCode).to.equal(302);
          expect(response.header.location).to.equal('/');

          return sessionForCookie(cookie);
        })
        .then((sess) => {
          expect(sess.flash.error.length).to.equal(1);
          expect(sess.flash.error[0].title).to.equal('Unauthorized');
          expect(sess.flash.error[0].message).to.equal(
            'Apologies; you don\'t have access to Federalist! '
          + 'Please contact the Federalist team if this is in error.'
          );
          done();
        })
        .catch(done);
    });

    it('should redirect to the home page with a flash error if the user is not in a allowed GitHub organization', (done) => {
      let cookie;
      const oauthState = 'state-123abc';
      githubAPINocks.githubAuth('unauthorized-user', [{ id: 654321 }]);
      unauthenticatedSession({ oauthState })
        .then((session) => {
          cookie = session;
          return request(app)
            .get(`/auth/github/callback?code=auth-code-123abc&state=${oauthState}`)
            .set('Cookie', cookie);
        })
        .then((response) => {
          expect(response.statusCode).to.equal(302);
          expect(response.header.location).to.equal('/');
          return sessionForCookie(cookie);
        })
        .then((sess) => {
          expect(sess.flash.error.length).to.equal(1);
          expect(sess.flash.error[0].title).to.equal('Unauthorized');
          expect(sess.flash.error[0].message).to.equal(
            'Apologies; you don\'t have access to Federalist! '
          + 'Please contact the Federalist team if this is in error.'
          );
          done();
        })
        .catch(done);
    });

    it('should redirect to a redirect path if one is set in the session', (done) => {
      // const redirectPath = '/path/to/something';
      const authRedirectPath = '/path/to/something';
      const oauthState = 'state-123abc';

      factory.user()
        .then(user => githubAPINocks.githubAuth(user.username, [{ id: 123456 }]))
        .then(() => unauthenticatedSession({ oauthState, authRedirectPath }))
        .then(session => request(app)
          .get(`/auth/github/callback?code=auth-code-123abc&state=${oauthState}`)
          .set('Cookie', session)
          .expect(302))
        .then((response) => {
        // expect(response.header.location).to.equal(redirectPath);
          expect(response.header.location).to.equal(authRedirectPath);
          done();
        })
        .catch(done);
    });
  });
});
