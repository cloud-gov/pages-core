const { expect } = require('chai');
const request = require('supertest');
const { UAAIdentity, User } = require('../../../../api/models');
const cfUAANock = require('../../support/cfUAANock');
const userFactory = require('../../support/factory/user');
const { uaaUser, uaaProfile, createUAAIdentity } = require('../../support/factory/uaa-identity');
const { sessionForCookie } = require('../../support/cookieSession');
const { unauthenticatedSession } = require('../../support/session');
const sessionConfig = require('../../../../api/admin/sessionConfig');

const { options: uaaConfig } = require('../../../../config').passport.uaa;

const app = require('../../../../app');

describe('Admin authentication request', () => {
  after(() => Promise.all([
    User.truncate(),
    UAAIdentity.truncate(),
  ]));

  describe('GET /admin/login', () => {
    it('should redirect to the configured authorization endpoint', (done) => {
      const locationRE = process.env.PRODUCT === 'pages'
        ? new RegExp(`^${uaaConfig.authorizationURL}`)
        : new RegExp('^https://github.com/login/oauth/authorize');

      request(app)
        .get('/admin/login')
        .expect('Location', locationRE)
        .expect(302, done);
    });
  });

  if (process.env.FEATURE_AUTH_UAA === 'true') {
    describe('GET /admin/auth/uaa/callback', () => {
      it('returns unauthorized if the user is not an admin', async () => {
        const uaaId = 'user_id_1';
        const code = 'code';
        const profile = { email: 'hello@example.com', user_id: uaaId };
        const user = await userFactory();
        await createUAAIdentity({
          uaaId,
          userId: user.id,
        });
        const userProfile = uaaUser({
          id: uaaId,
          groups: [{
            display: 'not.admin',
          }],
          ...profile,
        });

        cfUAANock.mockUAAAuth(profile, code);
        cfUAANock.mockVerifyUserGroup(uaaId, userProfile);

        return request(app)
          .get(`/admin/auth/uaa/callback?code=${code}&state=abc123`)
          .expect(401);
      });

      describe('when successful', () => {
        const uaaId = 'admin_id_1';
        const code = 'code';
        const email = 'hello@example.com';
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

        before(async () => {
          const user = await userFactory();
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

        it('returns a script tag', (done) => {
          request(app)
            .get(`/admin/auth/uaa/callback?code=${code}&state=abc123`)
            .expect((res) => {
              expect(res.text.trim()).to.match(/^<script nonce=".*">(.|\n)*<\/script>$/g);
            })
            .expect(200, done);
        });

        it('authenticates the session', async () => {
          const cookie = await unauthenticatedSession({ oauthState: 'state-123abc', cfg: sessionConfig });
          await request(app)
            .get(`/admin/auth/uaa/callback?code=${code}&state=abc123`)
            .set('Cookie', cookie)
            .expect(200)
            .expect((res) => {
              expect(res.text.trim()).to.match(/^<script nonce=".*">(.|\n)*<\/script>$/g);
            });
          const session = await sessionForCookie(cookie, 'federalist-admin.sid');
          expect(session.passport.user).to.exist;
        });
      });
    });
  }
});
