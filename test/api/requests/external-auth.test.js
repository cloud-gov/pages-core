const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const githubAPINocks = require('../support/githubAPINocks');
const { sessionForCookie } = require('../support/cookieSession');
const { unauthenticatedSession } = require('../support/session');
const app = require('../../../app');
const factory = require('../support/factory');
const EventCreator = require('../../../api/services/EventCreator');
const { limiter } = require('../../../api/external-auth');
const { Event } = require('../../../api/models');
const nock = require('nock');

describe('External authentication request', () => {
  let eventAuditStub;
  let eventErrorStub;

  beforeEach(async () => {
    // Reset the rate limiter store so counts don't leak between tests.
    await Promise.all([
      limiter.resetKey('::ffff:127.0.0.1'),
      limiter.resetKey('127.0.0.1'),
      limiter.resetKey('::1'),
    ]);
    eventAuditStub = sinon.stub(EventCreator, 'audit').resolves();
    eventErrorStub = sinon.stub(EventCreator, 'error').resolves();
  });

  afterEach(() => {
    nock.cleanAll();
    sinon.restore();
  });

  describe('GET /external/auth/github', () => {
    it('should redirect to GitHub for OAuth2 authentication', (done) => {
      request(app)
        .get('/external/auth/github')
        .expect('Location', /^https:\/\/github.com\/login\/oauth\/authorize.*/)
        .expect(302, done);
    });
  });

  describe('OAuth rate limiting', () => {
    const limit = 10;
    const rateLimitMessage = 'Too many authentication attempts, please try again later.';

    it('allows normal GitHub OAuth initiation requests', async () => {
      const res = await request(app).get('/external/auth/github').expect(302);

      expect(res.headers.location).to.match(
        /^https:\/\/github.com\/login\/oauth\/authorize/,
      );
    });

    it('advertises the dedicated OAuth request limit', async () => {
      const res = await request(app).get('/external/auth/github').expect(302);

      expect(Number(res.headers['ratelimit-limit'])).to.equal(limit);
      expect(Number(res.headers['ratelimit-remaining'])).to.equal(limit - 1);
      expect(res.headers).to.have.property('ratelimit-reset');
    });

    it('rate limits excessive GitHub OAuth initiation requests', async () => {
      for (let i = 0; i < limit; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await request(app).get('/external/auth/github').expect(302);
      }

      const res = await request(app).get('/external/auth/github').expect(429);

      expect(res.text).to.contain(rateLimitMessage);
    });

    it('rate limits excessive GitHub OAuth callback requests', async () => {
      for (let i = 0; i < limit; i += 1) {
        // Each allowed callback must have a matching mocked GitHub response.
        githubAPINocks.githubAuth('unauthorized-user', [{ id: 654321 }]);

        // eslint-disable-next-line no-await-in-loop
        await request(app)
          .get(`/external/auth/github/callback` + `?code=auth-code-${i}&state=state-${i}`)
          .expect(200);
      }

      const res = await request(app)
        .get(
          '/external/auth/github/callback' +
            '?code=excessive-auth-code&state=excessive-state',
        )
        .expect(429);

      expect(res.text).to.contain(rateLimitMessage);
    });

    it('logs an error when an OAuth request is rate limited', async () => {
      for (let i = 0; i < limit; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await request(app).get('/external/auth/github').expect(302);
      }

      // Ignore normal calls made during setup requests, if any.
      eventErrorStub.resetHistory();

      await request(app).get('/external/auth/github').expect(429);

      expect(eventErrorStub.calledOnce).to.equal(true);

      const [label, error] = eventErrorStub.firstCall.args;

      expect(label).to.equal(Event.labels.AUTHENTICATION_NETLIFY_CMS);
      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.contain('OAuth rate limit exceeded');
      expect(error.message).to.contain('GET /external/auth/github');
    });
  });

  describe('GET /external/auth/github/callback', () => {
    describe('sends script tag with error status and message', () => {
      it('return unsuccessful auth if user is not found', async () => {
        githubAPINocks.githubAuth('unauthorized-user', [{ id: 654321 }]);

        const res = await request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .expect(200);
        expect(res.text.trim()).to.match(
          // eslint-disable-next-line max-len
          /^<script nonce=".*">(.|\n)*authorization:github:error:{"message":"You must be a (Federalist|Pages) user with a connected GitHub account."}(.|\n)*<\/script>$/g,
        );
        expect(eventErrorStub.called).to.equal(true);
      });

      it(`return script tag with error
          if user has logged in before the duration of a session`, async () => {
        const user = await factory.user({
          signedInAt: new Date() - 2 * 24 * 60 * 60 * 1000,
        });
        githubAPINocks.githubAuth(user.username, [{ id: 123456 }]);
        const res = await request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .expect(200);
        expect(res.text.trim()).to.match(
          // eslint-disable-next-line max-len
          /^<script nonce=".*">(.|\n)*authorization:github:error:{"message":"You have not logged-in to (Federalist|Pages) within the past 24 hours. Please log in to (Federalist|Pages) and try again."}(.|\n)*<\/script>$/g,
        );
        expect(eventErrorStub.called).to.equal(true);
      });

      it(`return script tag with error
          if user has not logged in for the duration of a session`, async () => {
        const user = await factory.user({
          signedInAt: null,
        });
        githubAPINocks.githubAuth(user.username, [{ id: 123456 }]);
        const res = await request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .expect(200);
        expect(res.text.trim()).to.match(
          // eslint-disable-next-line max-len
          /^<script nonce=".*">(.|\n)*authorization:github:error:{"message":"You have not logged-in to (Federalist|Pages) within the past 24 hours. Please log in to (Federalist|Pages) and try again."}(.|\n)*<\/script>$/g,
        );
        expect(eventErrorStub.called).to.equal(true);
      });
    });

    describe('sends script tag with success status, token and provider', () => {
      let user;
      before(async () => {
        user = await factory.user();
      });

      beforeEach(async () => {
        githubAPINocks.githubAuth(user.username, [{ id: 123456 }]);
      });

      it('sends script tag with success status', async () => {
        const res = await request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .expect(200);
        expect(res.text.trim()).to.match(
          // eslint-disable-next-line max-len
          /^<script nonce=".*">(.|\n)*authorization:github:success(.|\n)*"token":(.|\n)*<\/script>$/g,
        );
        expect(res.text.trim()).to.match(
          // eslint-disable-next-line max-len
          /^<script nonce=".*">(.|\n)*authorization:github:success(.|\n)*"provider":(.|\n)*<\/script>$/g,
        );
        expect(eventAuditStub.called).to.equal(true);
      });

      it('does not add the user to the session', async () => {
        const cookie = await unauthenticatedSession({
          oauthState: 'state-123abc',
        });
        const res = await request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .set('Cookie', cookie)
          .expect(200);
        expect(res.text.trim()).to.match(
          // eslint-disable-next-line max-len
          /^<script nonce=".*">(.|\n)*authorization:github:success(.|\n)*"token":(.|\n)*<\/script>$/g,
        );
        expect(res.text.trim()).to.match(
          // eslint-disable-next-line max-len
          /^<script nonce=".*">(.|\n)*authorization:github:success(.|\n)*"provider":(.|\n)*<\/script>$/g,
        );
        const session = await sessionForCookie(cookie);
        expect(session.passport).to.be.undefined;
        expect(eventAuditStub.called).to.equal(true);
      });
    });
  });
});
