const { expect } = require('chai');
const request = require('supertest');
const { UAAIdentity, User } = require('../../../../api/models');
const cfUAANock = require('../../support/cfUAANock');
const userFactory = require('../../support/factory/user');
const { uaaUser, uaaProfile, createUAAIdentity } = require('../../support/factory/uaa-identity');
const { sessionForCookie } = require('../../support/cookieSession');
const { unauthenticatedSession } = require('../../support/session');
const sessionConfig = require('../../../../api/bull-board/sessionConfig');

const { options: uaaConfig } = require('../../../../config').passport.uaa;

const app = require('../../../../api/bull-board/app');

describe('bull board authentication request', () => {
  after(() => Promise.all([
    User.truncate(),
    UAAIdentity.truncate(),
  ]));

  describe('GET /login', () => {
    it('should redirect to the configured cloud.gov authorization endpoint', (done) => {
      const locationRE = new RegExp(`^${uaaConfig.authorizationURL}`);
      request(app)
        .get('/login')
        .expect('Location', locationRE)
        .expect(302, done);
    });
  });

  describe('GET /auth/uaa/logout', () => {
    it('redirects to the root', () => request(app)
      .get('/auth/uaa/logout')
      .expect('Location', '/')
      .expect(302));
  });

  describe('GET / while unauthenticated', () => {
    it('redirects to the root', () => request(app)
      .get('/')
      .expect('Location', '/login')
      .expect(302));
  });

  describe('GET /auth/uaa/callback', () => {
    it('returns unauthorized if the user is not an admin', async () => {
      const uaaId = 'bull_non_admin_id_1';
      const code = 'code';
      const profile = { email: 'hello@bull-example.com', user_id: uaaId };
      const user = await userFactory();
      await createUAAIdentity({
        uaaId,
        userId: user.id,
      });
      const userProfile = uaaUser({
        id: uaaId,
        groups: [{
          display: 'pages.user',
        }],
        ...profile,
      });

      cfUAANock.mockUAAAuth(profile, code);
      cfUAANock.mockVerifyUserGroup(uaaId, userProfile);

      return request(app)
        .get(`/auth/uaa/callback?code=${code}&state=abc123`)
        .expect(401);
    });

    describe('when successful', () => {
      const uaaId = 'bull_admin_id_1';
      const code = 'code';
      const email = 'hello@bull-example.com';
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
      let user;
      before(async () => {
        user = await userFactory();
        await createUAAIdentity({
          uaaId,
          email,
          userId: user.id,
        });
      });

      beforeEach(() => {
        cfUAANock.mockUAAAuth(uaaUserProfile, code);
        cfUAANock.mockVerifyUserGroup(uaaId, uaaUserInfo);
      });

      it('authenticates the session', async () => {
        const oauthState = 'state-123abc';
        const cookie = await unauthenticatedSession({ oauthState, cfg: sessionConfig });
        await request(app)
          .get(`/auth/uaa/callback?code=${code}&state=${oauthState}`)
          .set('Cookie', cookie)
          .expect('Location', '/')
          .expect(302);

        const authSession = await sessionForCookie(cookie, 'federalist-bull-board.sid');

        expect(authSession.passport.user).to.exist;
        expect(authSession.authenticated).to.equal(true);
        expect(authSession.passport.user).to.equal(user.id);
      });
    });

  });
});
