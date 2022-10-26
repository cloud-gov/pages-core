const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const githubAPINocks = require('../support/githubAPINocks');
const { sessionForCookie } = require('../support/cookieSession');
const { unauthenticatedSession } = require('../support/session');
const app = require('../../../app');
const factory = require('../support/factory');
const EventCreator = require('../../../api/services/EventCreator');

describe('External authentication request', () => {
  describe('GET /external/auth/github', () => {
    before(async () => {
      const siteUser = await factory.user();
      await factory.site({
        demoBranch: 'demo-branch',
        demoDomain: 'https://demo.example.gov',
        domain: 'https://example.gov',
        owner: siteUser.username,
        repository: 'example-site',
        users: [siteUser],
        defaultConfig: { hello: 'world' },
      });
    });

    it('should redirect to GitHub for OAuth2 authentication', (done) => {
      // const authEventSpy = sinon.spy(EventCreator, 'audit');

      request(app)
        .get('/external/auth/github')
        .set('Referer', 'https://site.cloud.gov')
        .expect('Location', /^https:\/\/github.com\/login\/oauth\/authorize.*/)
        .expect(302, done);

      // expect(authEventSpy.called).to.be.true;
    });

    it('should accept custom site names', (done) => {
      // const authEventSpy = sinon.spy(EventCreator, 'audit');

      request(app)
        .get('/external/auth/github')
        .set('Referer', 'https://example.gov')
        .expect('Location', /^https:\/\/github.com\/login\/oauth\/authorize.*/)
        .expect(302, done);

      // expect(authEventSpy.called).to.be.true;
    });

    it('should error for non-registered sites', async () => {
      const res = await request(app)
        .get('/external/auth/github')
        .set('Referer', 'https://failure.gov')
        .expect(200);

      expect(res.text.trim()).to.match(/^<script nonce=".*">(.|\n)*authorization:github:error:{"message":"Please login from a registered cloud.gov Pages site"}(.|\n)*<\/script>$/g);
    });
  });

  describe('GET /external/auth/github/callback', () => {
    describe('sends script tag with success status, token and provider', () => {
      let user;
      before(async () => {
        user = await factory.user();
      });

      beforeEach(() => {
        githubAPINocks.githubAuth(user.username, [{ id: 123456 }]);
      });

      it('sends script tag with success status', async () => {
        const res = await request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .expect(200);
        expect(res.text.trim()).to.match(/^<script nonce=".*">(.|\n)*authorization:github:success(.|\n)*"token":(.|\n)*<\/script>$/g);
        expect(res.text.trim()).to.match(/^<script nonce=".*">(.|\n)*authorization:github:success(.|\n)*"provider":(.|\n)*<\/script>$/g);
      });

      it('does not add the user to the session', async () => {
        const cookie = await unauthenticatedSession({ oauthState: 'state-123abc' });
        const res = await request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .set('Cookie', cookie)
          .expect(200);
        expect(res.text.trim()).to.match(/^<script nonce=".*">(.|\n)*authorization:github:success(.|\n)*"token":(.|\n)*<\/script>$/g);
        expect(res.text.trim()).to.match(/^<script nonce=".*">(.|\n)*authorization:github:success(.|\n)*"provider":(.|\n)*<\/script>$/g);
        const session = await sessionForCookie(cookie);
        expect(session.passport).to.be.undefined;
      });
    });
  });
});
