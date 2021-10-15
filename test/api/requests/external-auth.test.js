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
    describe('when failure', () => {
      it('return unauthorized if the user is not in an allowed GitHub organization', async () => {
        githubAPINocks.githubAuth('unauthorized-user', [{ id: 654321 }]);
        const res = await request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .expect(200);
        expect(res.text.trim()).to.match(/^<script nonce=".*">(.|\n)*authorization:github:error:{"message":"Unauthorized: You must be an a cloud.gov Pages user with your GitHub account added to your cloud.gov Pages profile."}(.|\n)*<\/script>$/g);
      });

      it('return unauthorized if the user is not in an allowed GitHub organization', async () => {
        const user = await factory.user({ signedInAt: (new Date() - (2 * 24 * 60 * 60 * 1000)) });
        githubAPINocks.githubAuth(user.username, [{ id: 123456 }]);
        const res = await request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .expect(200);
        expect(res.text.trim()).to.match(/^<script nonce=".*">(.|\n)*authorization:github:error:{"message":"Session Expired: It has been more than 24 hours since you have logged-in to cloud.gov Pages. Please login in to cloud.gov Pages and then try again."}(.|\n)*<\/script>$/g);
      });
    });

    describe('when successful', () => {
      let user;
      before(async () => {
        user = await factory.user();
      });

      beforeEach(() => {
        githubAPINocks.githubAuth(user.username, [{ id: 123456 }]);
      });

      it('returns a script tag', async () => {
        const res = await request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .expect(200);
        expect(res.text.trim()).to.match(/^<script nonce=".*">(.|\n)*authorization:github:success(.|\n)*<\/script>$/g);
      });

      it('does not add the user to the session', async () => {
        const cookie = await unauthenticatedSession({ oauthState: 'state-123abc' });
        const res = await request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .set('Cookie', cookie)
          .expect(200);
        expect(res.text.trim()).to.match(/^<script nonce=".*">(.|\n)*authorization:github:success(.|\n)*<\/script>$/g);
        const session = await sessionForCookie(cookie);
        expect(session.passport).to.be.undefined;
      });
    });
  });
});
