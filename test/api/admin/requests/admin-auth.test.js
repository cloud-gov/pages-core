const { expect } = require('chai');
const request = require('supertest');
const { UAAIdentity, User } = require('../../../../api/models');
const cfUAANock = require('../../support/cfUAANock');
const userFactory = require('../../support/factory/user');
const {
  uaaUser,
  uaaProfile,
  createUAAIdentity,
} = require('../../support/factory/uaa-identity');
const { sessionForCookie } = require('../../support/cookieSession');
const { unauthenticatedSession } = require('../../support/session');
const sessionConfig = require('../../../../api/admin/sessionConfig');

const { options: uaaConfig } = require('../../../../config').passport.uaa;

const app = require('../../../../app');

describe('Admin authentication request', () => {
  after(() => Promise.all([User.truncate(), UAAIdentity.truncate()]));

  describe('GET /admin/login', () => {
    it('should redirect to the configured authorization endpoint', (done) => {
      const locationRE =
        process.env.PRODUCT === 'pages'
          ? new RegExp(`^${uaaConfig.authorizationURL}`)
          : new RegExp('^https://github.com/login/oauth/authorize');

      request(app).get('/admin/login').expect('Location', locationRE).expect(302, done);
    });
  });

  describe('GET /admin/auth/uaa/callback', () => {
    it('returns unauthorized if the user is not an admin', async () => {
      const uaaId = 'user_id_1';
      const code = 'code';
      const profile = {
        email: 'justauser@example.com',
        user_id: uaaId,
      };
      const user = await userFactory();
      await createUAAIdentity({
        uaaId,
        userId: user.id,
        email: profile.email,
      });
      const userProfile = uaaUser({
        id: uaaId,
        groups: [
          {
            display: 'pages.user',
          },
        ],
        ...profile,
      });

      cfUAANock.mockUAAAuth(profile, code);
      cfUAANock.mockVerifyUser(uaaId, userProfile);

      return request(app)
        .get(`/admin/auth/uaa/callback?code=${code}&state=abc123`)
        .expect(401);
    });

    it('returns forbidden with invalid code', () => {
      const invalidCode = 'invlaid';

      cfUAANock.mockExchangeTokenFailure();

      return request(app)
        .get(`/admin/auth/uaa/callback?code=${invalidCode}&state=abc123`)
        .expect(403);
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
        groups: [
          {
            display: 'pages.admin',
          },
        ],
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
        cfUAANock.mockVerifyUser(uaaId, uaaUserInfo);
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
        const cookie = await unauthenticatedSession({
          oauthState: 'state-123abc',
          cfg: sessionConfig,
        });

        const res = await request(app)
          .get(`/admin/auth/uaa/callback?code=${code}&state=abc123`)
          .set('Cookie', cookie)
          .expect(200);

        const updatedCookie = res.header['set-cookie'][0];
        const session = await sessionForCookie(updatedCookie, 'pages-admin.sid');
        expect(res.text.trim()).to.match(/^<script nonce=".*">(.|\n)*<\/script>$/g);
        expect(session.passport.user).to.exist;
        expect(session.passport.user.role).to.exist;
      });
    });
  });
});
