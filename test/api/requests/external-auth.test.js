const { expect } = require('chai');
const request = require('supertest');
const githubAPINocks = require('../support/githubAPINocks');
const { sessionForCookie } = require('../support/cookieSession');
const { unauthenticatedSession } = require('../support/session');
const app = require('../../../app');

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
    it('return unauthorized if the user is not in an allowed GitHub organization', (done) => {
      githubAPINocks.githubAuth('unauthorized-user', [{ id: 654321 }]);
      request(app)
        .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
        .expect(401, done);
    });

    describe('when successful', () => {
      beforeEach(() => {
        githubAPINocks.githubAuth('user', [{ id: 123456 }]);
      });

      it('returns a script tag', (done) => {
        request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .expect((res) => {
            expect(res.text.trim()).to.match(/^<script>(.|\n)*<\/script>$/g);
          })
          .expect(200, done);
      });

      it('does not add the user to the session', (done) => {
        let cookie;
        unauthenticatedSession({ oauthState: 'state-123abc' })
          .then((session) => {
            cookie = session;
            return request(app)
              .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
              .set('Cookie', cookie)
              .expect(200)
              .expect((res) => {
                expect(res.text.trim()).to.match(/^<script>(.|\n)*<\/script>$/g);
              });
          })
          .then(() => sessionForCookie(cookie))
          .then((session) => {
            expect(session.passport).to.be.undefined;
            done();
          })
          .catch(done);
      });
    });
  });
});
