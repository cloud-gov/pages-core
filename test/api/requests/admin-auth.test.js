const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const githubAPINocks = require('../support/githubAPINocks');
const { sessionForCookie } = require('../support/cookieSession');
const { unauthenticatedSession } = require('../support/session');
const FederalistUsersHelper = require('../../../api/services/FederalistUsersHelper');
const sessionConfig = require('../../../api/admin/sessionConfig');

const app = require('../../../app');

describe('Admin authentication request', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('GET /admin/auth/github', () => {
    it('should redirect to GitHub for OAuth2 authentication', (done) => {
      request(app)
        .get('/admin/auth/github')
        .expect('Location', /^https:\/\/github.com\/login\/oauth\/authorize.*/)
        .expect(302, done);
    });
  });

  describe('GET /admin/auth/github/callback', () => {
    it('returns unauthorized if the user is not in an allowed GitHub organization', (done) => {
      githubAPINocks.githubAuth('unauthorized-user', [{ id: 654321 }]);
      request(app)
        .get('/admin/auth/github/callback?code=auth-code-123abc&state=state-123abc')
        .expect(401, done);
    });

    it('returns unauthorized if the user is not an admin', (done) => {
      githubAPINocks.githubAuth('user', [{ id: 123456 }]);
      sinon.stub(FederalistUsersHelper, 'federalistUsersAdmins').resolves([]);
      request(app)
        .get('/admin/auth/github/callback?code=auth-code-123abc&state=state-123abc')
        .expect(401, done);
    });

    describe('when successful', () => {
      beforeEach(() => {
        githubAPINocks.githubAuth('user', [{ id: 123456 }]);
        sinon.stub(FederalistUsersHelper, 'federalistUsersAdmins').resolves(['USER']);
      });

      it('returns a script tag', (done) => {
        request(app)
          .get('/admin/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .expect((res) => {
            expect(res.text.trim()).to.match(/^<script>(.|\n)*<\/script>$/g);
          })
          .expect(200, done);
      });

      it('authenticates the session', async () => {
        const cookie = await unauthenticatedSession({ oauthState: 'state-123abc', cfg: sessionConfig });
        await request(app)
          .get('/admin/auth/github/callback?code=auth-code-123abc&state=state-123abc')
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
