const { expect } = require('chai');
const request = require('supertest');
const crypto = require('crypto');
const csrfToken = require('../../support/csrfToken');
const { UAAIdentity, User } = require('../../../../api/models');
const cfUAANock = require('../../support/cfUAANock');
const userFactory = require('../../support/factory/user');
const { uaaUser, uaaProfile, createUAAIdentity } = require('../../support/factory/uaa-identity');
const sessionConfig = require('../../../../api/bull-board/sessionConfig');
const config = require('../../../../config');
const app = require('../../../../api/bull-board/app');

const { options: uaaConfig } = config.passport.uaa;

function unauthenticatedSession({ oauthState, authRedirectPath, cfg = sessionConfig } = {}) {
  return new Promise((resolve, reject) => {
    const sessionKey = crypto.randomBytes(8).toString('hex');

    const sessionBody = {
      cookie: {
        originalMaxAge: null,
        expires: null,
        httpOnly: true,
        path: '/',
      },
      flash: {},
      authenticated: false,
      csrfSecret: csrfToken.TEST_CSRF_SECRET,
      'oauth2:github.com': { state: oauthState },
      authRedirectPath,
    };

    const cb = (err) => {
      if (err) {
        reject(err);
      }

      try {
        const signedSessionKey = `${sessionKey}.${crypto
          .createHmac('sha256', cfg.secret)
          .update(sessionKey)
          .digest('base64')
          .replace(/=+$/, '')}`;

        resolve(`${cfg.key}=s%3A${signedSessionKey}`);
      } catch (e) {
        reject(e);
      }
    };
    cfg.store.set(sessionKey, sessionBody, cb);
  });
}

const sessionForCookie = (cookie, sid = 'pages-bull-board.sid') => {
  const sessionID = cookie.replace(`${sid}=s%3A`, '').split('.')[0];
  return new Promise((resolve, reject) => {
    sessionConfig.store.get(sessionID, (err, sessionBody) => {
      if (err) {
        reject(err);
      } else {
        resolve(sessionBody);
      }
    });
  });
};

if (config.product === 'pages') {
  describe('bull board authentication request', () => {
    after(() => Promise.all([
      User.truncate(),
      UAAIdentity.truncate(),
    ]));

    describe('GET /login', () => {
      it('should redirect to the configured cloud.gov authorization endpoint', () => {
        const locationRE = new RegExp(`^${uaaConfig.authorizationURL}`);
        request(app)
          .get('/login')
          .expect('Location', locationRE)
          .expect(302);
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
          const uaaIdentity = await user.getUAAIdentity();
          const cookie = await unauthenticatedSession({ oauthState, cfg: sessionConfig });

          await request(app)
            .get(`/auth/uaa/callback?code=${code}&state=${oauthState}`)
            .set('Cookie', cookie)
            .expect('Location', '/')
            .expect(302);

          const authSession = await sessionForCookie(cookie, 'pages-bull-board.sid');

          expect(authSession.passport.user).to.exist;
          expect(authSession.authenticated).to.equal(true);
          expect(authSession.passport.user).to.equal(uaaIdentity.uaaId);
        });
      });
    });
  });
}
