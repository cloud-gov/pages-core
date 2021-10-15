const { expect } = require('chai');
const request = require('supertest');
const githubAPINocks = require('../support/githubAPINocks');
const { sessionForCookie } = require('../support/cookieSession');
const { unauthenticatedSession } = require('../support/session');
const app = require('../../../app');
const factory = require('../support/factory');

describe('External authentication request', () => {
  describe('GET /external/auth/github', () => {
    it('should redirect to GitHub for OAuth2 authentication', (done) => {
      request(app)
        .get('/external/auth/github')
        .expect('Location', /^https:\/\/github.com\/login\/oauth\/authorize.*/)
        .expect(302, done);
    });
  });

  describe('GET /external/auth/github/callback', () => {
    describe('sends script tag with error status and message', () => {
      it('return unsuccessful auth if user is not found', async () => {
        githubAPINocks.githubAuth('unauthorized-user', [{ id: 654321 }]);
        const res = await request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .expect(200);
        expect(res.text.trim()).to.match(/^<script nonce=".*">(.|\n)*authorization:github:error:{"message":"You must be a Pages user with your GitHub account added to your Pages profile."}(.|\n)*<\/script>$/g);
      });

      it('return script tag with error if user has not logged in for the duration of a session', async () => {
        const user = await factory.user({ signedInAt: (new Date() - (2 * 24 * 60 * 60 * 1000)) });
        githubAPINocks.githubAuth(user.username, [{ id: 123456 }]);
        const res = await request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .expect(200);
        expect(res.text.trim()).to.match(/^<script nonce=".*">(.|\n)*authorization:github:error:{"message":"You have not logged-in to Pages within the past 24 hours. Please log in to Pages and try again."}(.|\n)*<\/script>$/g);
      });

      it('return script tag with error if user has not logged in for the duration of a session', async () => {
        const user = await factory.user({ signedInAt: null });
        githubAPINocks.githubAuth(user.username, [{ id: 123456 }]);
        const res = await request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .expect(200);
        expect(res.text.trim()).to.match(/^<script nonce=".*">(.|\n)*authorization:github:error:{"message":"You have not logged-in to Pages within the past 24 hours. Please log in to Pages and try again."}(.|\n)*<\/script>$/g);
      });
    });

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
