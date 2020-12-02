const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const cfUAANock = require('../../support/cfUAANock');
const userFactory = require('../../support/factory/user');
const { sessionForCookie } = require('../../support/cookieSession');
const { unauthenticatedSession } = require('../../support/session');
const sessionConfig = require('../../../../api/admin/sessionConfig');

const { options: uaaConfig } = require('../../../../config').passport.uaa;

const app = require('../../../../app');

describe('Admin authentication request', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('GET /admin/login', () => {
    it('should redirect to the configured cloud.gov authorization endpoint', (done) => {
      const locationRE = new RegExp(`^${uaaConfig.authorizationURL}`);
      request(app)
        .get('/admin/login')
        .expect('Location', locationRE)
        .expect(302, done);
    });
  });

  describe('GET /admin/auth/uaa/callback', () => {
    it('returns unauthorized if the user is not an admin', (done) => {
      const code = 'code';
      const profile = { email: 'hello@example.com' };

      cfUAANock.uaaAuth(profile, code);

      request(app)
        .get(`/admin/auth/uaa/callback?code=${code}&state=abc123`)
        .expect(401, done);
    });

    describe('when successful', () => {
      const code = 'code';
      const adminEmail = 'david.corwin@gsa.gov';

      beforeEach(async () => {
        cfUAANock.uaaAuth({ email: adminEmail }, code);
        await userFactory({ adminEmail });
      });

      it('returns a script tag', (done) => {
        request(app)
          .get(`/admin/auth/uaa/callback?code=${code}&state=abc123`)
          .expect((res) => {
            expect(res.text.trim()).to.match(/^<script>(.|\n)*<\/script>$/g);
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
            expect(res.text.trim()).to.match(/^<script>(.|\n)*<\/script>$/g);
          });
        const session = await sessionForCookie(cookie, 'federalist-admin.sid');
        expect(session.passport.user).to.exist;
      });
    });
  });
});
