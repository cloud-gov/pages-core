/* eslint-disable no-underscore-dangle */
const { expect } = require('chai');
const nock = require('nock');
const request = require('supertest');
const sinon = require('sinon');
const app = require('../../../app');
const config = require('../../../config');
const { UAAIdentity, User } = require('../../../api/models');
const EventCreator = require('../../../api/services/EventCreator');
const factory = require('../support/factory');
const { uaaUser, uaaProfile } = require('../support/factory/uaa-identity');
const githubAPINocks = require('../support/githubAPINocks');
const cfUAANocks = require('../support/cfUAANock');
const { authenticatedSession, unauthenticatedSession } = require('../support/session');
const { sessionForCookie } = require('../support/cookieSession');

const { github, uaa } = config.passport;
const flashMessage = `Apologies; you are not authorized to access ${config.app.appName}! Please contact the ${config.app.appName} team if this is in error.`;

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

  context('Github', () => {
    describe('GET /login/github', () => {
      it('should redirect to the configured IdP for authentication', (done) => {
        request(app)
          .get('/login/github')
          .expect('Location', new RegExp(`^${github.options.authorizationURL}`))
          .expect(302, done);
      });

      it('should redirect to the root URL if the users is logged in', (done) => {
        authenticatedSession().then((cookie) => {
          request(app)
            .get('/login/github')
            .set('Cookie', cookie)
            .expect('Location', '/')
            .expect(302, done);
        });
      });
    });

    describe('GET /logout/github', () => {
      it('should de-authenticate and remove the user from the session', async () => {
        const user = await factory.user();
        const cookie = await authenticatedSession(user);
        const authSession = await sessionForCookie(cookie);

        expect(authSession.authenticated).to.be.equal(true);
        expect(authSession.passport.user).to.equal(user.id);

        await request(app)
          .get('/logout/github')
          .set('Cookie', cookie)
          .expect('Location', '/')
          .expect(302);

        expect(eventAuditStub.called).to.equal(true);

        const nonAuthSession = await sessionForCookie(cookie);

        expect(nonAuthSession).to.equal(null);

        expect(eventAuditStub.called).to.equal(true);
      });

      it('should redirect to the root URL for an unauthenticated user', (done) => {
        request(app)
          .get('/logout/github')
          .expect('Location', '/')
          .expect(302, done);
      });
    });

    context('Callbacks', () => {
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

        context('when the user exists and has a uaa identity and uaa auth is enabled', () => {
          const uaaAuth = process.env.FEATURE_AUTH_UAA;

          before(() => {
            process.env.FEATURE_AUTH_UAA = 'true';
          });

          after(() => {
            process.env.FEATURE_AUTH_UAA = uaaAuth;
          });

          it('should not authenticate the user', (done) => {
            let user;
            let cookie;
            nock.cleanAll();
            const oauthState = 'state-123abc';
            factory.user()
              .then((model) => {
                user = model;
                return factory.uaaIdentity({ userId: user.id });
              })
              .then(() => githubAPINocks.githubAuth(user.username, [{ id: 123456 }]))
              .then(() => unauthenticatedSession({ oauthState }))
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
                  'You must login with your UAA account. Please try again.'
                );
                done();
              })
              .catch(done);
          });
        });

        context('when the user exists and has a uaa identity and uaa auth is NOT enabled', () => {
          const uaaAuth = process.env.FEATURE_AUTH_UAA;

          before(() => {
            process.env.FEATURE_AUTH_UAA = 'false';
          });

          after(() => {
            process.env.FEATURE_AUTH_UAA = uaaAuth;
          });

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
        });

        context('when the user does not exist in the database', () => {
          it('should not authenticate the user', (done) => {
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
              })
              .then(() => sessionForCookie(cookie))
              .then((sess) => {
                expect(sess.flash.error.length).to.equal(1);
                expect(sess.flash.error[0]).to.equal(flashMessage);
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
              expect(sess.flash.error[0]).to.equal(flashMessage);
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
  });

  context.skip('UAA', () => {
    context('Callbacks', () => {
      beforeEach(() => Promise.all([
        User.truncate(),
        UAAIdentity.truncate(),
      ]));

      afterEach(() => Promise.all([
        User.truncate(),
        UAAIdentity.truncate(),
      ]));

      describe('GET /login', () => {
        it('should redirect to the configured IdP for authentication', (done) => {
          request(app)
            .get('/login')
            .expect('Location', new RegExp(`^${uaa.options.authorizationURL}`))
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
        it('should de-authenticate and remove the user from the session', async () => {
          const user = await factory.user();
          const cookie = await authenticatedSession(user);
          const authSession = await sessionForCookie(cookie);

          expect(authSession.authenticated).to.be.equal(true);
          expect(authSession.passport.user).to.equal(user.id);

          await request(app)
            .get('/logout')
            .set('Cookie', cookie)
            .expect('Location', new RegExp(`^${uaa.options.logoutURL}`))
            .expect(302);

          expect(eventAuditStub.called).to.equal(true);

          const nonAuthSession = await sessionForCookie(cookie);

          expect(nonAuthSession).to.equal(null);

          expect(eventAuditStub.called).to.equal(true);
        });

        it('should redirect to the root URL for an unauthenticated user', (done) => {
          request(app)
            .get('/logout')
            .expect('Location', new RegExp(`^${uaa.options.logoutURL}`))
            .expect(302, done);
        });
      });

      describe('GET /auth/uaa/callback', () => {
        context('when the admin user exists in the database', () => {
          it('should authenticate the user', async () => {
            nock.cleanAll();
            const uaaId = 'uaa-admin-authenticated';
            const email = 'uaa-admin-authenticated@example.com';
            const uaaUserProfile = uaaProfile({
              userId: uaaId,
              email,
            });
            const uaaUserInfo = uaaUser({
              uaaId,
              email,
              groups: [{
                display: 'pages.admin',
              }],
            });
            const user = await factory.user();
            await factory.uaaIdentity({
              uaaId,
              email,
              userId: user.id,
            });
            const oauthState = 'state-123abc';
            const code = 'code';

            cfUAANocks.mockUAAAuth(uaaUserProfile, code);
            cfUAANocks.mockVerifyUserGroup(uaaId, uaaUserInfo);

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
            const uaaId = 'uaa-admin-does-not-exist';
            const profile = { email: 'hello@example.com', user_id: uaaId };
            const userProfile = uaaUser({
              id: uaaId,
              groups: [{
                display: 'pages.admin',
              }],
              ...profile,
            });
            const oauthState = 'state-123abc';
            const code = 'code';

            cfUAANocks.mockUAAAuth(profile, code);
            cfUAANocks.mockVerifyUserGroup(uaaId, userProfile);

            const cookie = await unauthenticatedSession({ oauthState });

            await request(app)
              .get(`/auth/uaa/callback?code=${code}&state=${oauthState}`)
              .set('Cookie', cookie)
              .expect('Location', '/')
              .expect(302);

            const session = await sessionForCookie(cookie);

            expect(session.flash.error.length).to.equal(1);
            expect(session.flash.error[0]).to.equal(flashMessage);
            expect(eventAuditStub.called).to.equal(false);
          });
        });
      });

      it('should redirect to a redirect path if one is set in the session', async () => {
        const uaaId = 'uaa-admin-auth-redirect';
        const email = 'uaa-admin-auth-redirect@example.com';
        const uaaUserProfile = uaaProfile({
          userId: uaaId,
          email,
        });
        const uaaUserInfo = uaaUser({
          uaaId,
          email,
          groups: [{
            display: 'pages.admin',
          }],
        });
        const user = await factory.user();
        await factory.uaaIdentity({
          uaaId,
          email,
          userId: user.id,
        });
        const authRedirectPath = '/path/to/something';
        const oauthState = 'state-123abc';
        const code = 'code';

        cfUAANocks.mockUAAAuth(uaaUserProfile, code);
        cfUAANocks.mockVerifyUserGroup(uaaId, uaaUserInfo);

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
