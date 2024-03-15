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
const cfUAANocks = require('../support/cfUAANock');
const { authenticatedSession, unauthenticatedSession } = require('../support/session');
const { sessionForCookie } = require('../support/cookieSession');

const { uaa } = config.passport;
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

  context('UAA', () => {
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

            const res = await request(app)
              .get(`/auth/uaa/callback?code=${code}&state=${oauthState}`)
              .set('Cookie', cookie)
              .expect(302);

            const updatedCookie = res.header['set-cookie'][0];
            const authSession = await sessionForCookie(updatedCookie);
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
            expect(eventAuditStub.called).to.equal(true);
          });
        });
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
