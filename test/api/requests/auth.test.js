/* eslint-disable no-underscore-dangle */
const { expect } = require('chai');
const nock = require('nock');
const request = require('supertest');
const sinon = require('sinon');
const app = require('../../../app');
const config = require('../../../config');
const { User } = require('../../../api/models');
const EventCreator = require('../../../api/services/EventCreator');
const factory = require('../support/factory');
const githubAPINocks = require('../support/githubAPINocks');
const cfUAANocks = require('../support/cfUAANock');
const { authenticatedSession, unauthenticatedSession } = require('../support/session');
const { sessionForCookie } = require('../support/cookieSession');

const { authIDP } = config.env;
const { options } = config.passport[authIDP];

const authorizationURL = authIDP === 'github' ? 'https://github.com/login/oauth/authorize' : options.authorizationURL;

describe('Authentication requests', () => {
  let eventAuditStub;
  beforeEach(async () => {
    eventAuditStub = sinon.stub(EventCreator, 'audit').resolves();
    await User.truncate();
  });
  afterEach(async () => {
    sinon.restore();
    await User.truncate();
  });

  describe('GET /login', () => {
    it('should redirect to the configured IdP for authentication', (done) => {
      request(app)
        .get('/login')
        .expect('Location', new RegExp(`^${authorizationURL}`))
        .expect(302, done);
    });

    it('should redirect to the root URL if the users is logged in', (done) => {
      authenticatedSession().then((cookie) => {
        request(app)
          .get('/login')
          .set('Cookie', cookie)
          .expect('Location', '/')
          .expect(302, done);
      });
    });
  });

  describe('GET /logout', () => {
    const logoutRedirectURL = authIDP === 'github' ? '/' : new RegExp(`^${options.logoutURL}`);

    it('should de-authenticate and remove the user from the session', async () => {
      const user = await factory.user();
      const cookie = await authenticatedSession(user);
      const authSession = await sessionForCookie(cookie);

      expect(authSession.authenticated).to.be.equal(true);
      expect(authSession.passport.user).to.equal(user.id);

      await request(app)
        .get('/logout')
        .set('Cookie', cookie)
        .expect('Location', logoutRedirectURL)
        .expect(302);

      expect(eventAuditStub.called).to.equal(true);

      const nonAuthSession = await sessionForCookie(cookie);

      expect(nonAuthSession).to.equal(null);

      expect(eventAuditStub.called).to.equal(true);
    });

    it('should redirect to the root URL for an unauthenticated user', (done) => {
      request(app)
        .get('/logout')
        .expect('Location', logoutRedirectURL)
        .expect(302, done);
    });
  });

  context('github callbacks', () => {
    describe('GET /auth/github/callback', () => {
      context('when the user exists in the database', () => {
        it('should authenticate the user', (done) => {
          let user;
          let cookie;
          nock.cleanAll();
          const oauthState = 'state-123abc';
          factory.user()
            .then((model) => {
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
              expect(eventAuditStub.calledOnce).to.equal(true);
              return user.reload();
            })
            .then((model) => {
              user = model;
              done();
            });
        });

        it('should not create a new user', (done) => {
          let user;
          let userCount;
          const oauthState = 'state-123abc';
          factory.user({ isActive: true })
            .then((model) => {
              user = model;
              githubAPINocks.githubAuth(user.username, [{ id: 123456 }]);
              expect(user.isActive).to.be.true;
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
              return user.reload();
            })
            .then((model) => {
              user = model;
              expect(user.isActive).to.be.true;
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
              expect(eventAuditStub.calledOnce).to.equal(true);
              expect(user.isActive).to.be.true;
              done();
            })
            .catch(done);
        });
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
            expect(sess.flash.error[0]).to.equal(
              'Apologies; you don\'t have access to Federalist! Please contact the Federalist team if this is in error.'
            );
            expect(eventAuditStub.called).to.equal(false);
            done();
          })
          .catch(done);
      });

      it('should redirect to a redirect path if one is set in the session', (done) => {
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
            expect(response.header.location).to.equal(authRedirectPath);
            done();
          })
          .catch(done);
      });
    });
  });

  context('uaa callbacks', () => {
    describe('GET /auth/uaa/callback', () => {
      context('when the admin user exists in the database', () => {
        it('should authenticate the user', async () => {
          nock.cleanAll();
          const user = await factory.user({
            adminEmail: 'admin@example.com',
          });
          const oauthState = 'state-123abc';
          const code = 'code';

          cfUAANocks.uaaAuth({ email: user.adminEmail }, code);

          const cookie = await unauthenticatedSession({ oauthState });

          await request(app)
            .get(`/auth/uaa/callback?code=${code}&state=${oauthState}`)
            .set('Cookie', cookie)
            .expect(302);

          const authSession = await sessionForCookie(cookie);

          expect(authSession.authenticated).to.equal(true);
          expect(authSession.passport.user).to.equal(user.id);
          expect(eventAuditStub.calledOnce).to.equal(true);
        });
      });

      context('when the admin user does not exist in the database', () => {
        it('should fail to authenticate, redirect the user and provide a flash message', async () => {
          const code = 'code';
          const oauthState = 'state-123abc';

          cfUAANocks.uaaAuth({ email: 'foo@bar.com' }, code);

          const cookie = await unauthenticatedSession({ oauthState });

          await request(app)
            .get(`/auth/uaa/callback?code=${code}&state=${oauthState}`)
            .set('Cookie', cookie)
            .expect('Location', '/')
            .expect(302);

          const session = await sessionForCookie(cookie);

          expect(session.flash.error.length).to.equal(1);
          expect(session.flash.error[0]).to.equal(
            'Apologies; you don\'t have access to Federalist! Please contact the Federalist team if this is in error.'
          );
          expect(eventAuditStub.called).to.equal(false);
        });
      });

      it('should redirect to a redirect path if one is set in the session', async () => {
        const authRedirectPath = '/path/to/something';
        const oauthState = 'state-123abc';
        const code = 'code';

        const user = await factory.user({
          adminEmail: 'admin@example.com',
        });

        cfUAANocks.uaaAuth({ email: user.adminEmail }, code);

        const session = await unauthenticatedSession({ oauthState, authRedirectPath });

        await request(app)
          .get(`/auth/uaa/callback?code=${code}&state=${oauthState}`)
          .set('Cookie', session)
          .expect('Location', authRedirectPath)
          .expect(302);
      });
    });

    describe('GET /auth/uaa/logout', () => {
      it('redirects to the root', () => request(app)
        .get('/auth/uaa/logout')
        .expect('Location', '/')
        .expect(302));
    });
  });
});
