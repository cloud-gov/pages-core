const { expect } = require('chai');
const sinon = require('sinon');
const request = require('supertest');

const app = require('../../../../api/admin');
const { ADMIN_API_RATE_LIMIT_MAX_REQUESTS, ADMIN_AUTH_RATE_LIMIT_MAX_FAILED_ATTEMPTS } =
  app;
const { logger } = require('../../../../winston');
const { resetRateLimits } = require('../../support/rateLimits');

describe('Admin rate limiting', () => {
  beforeEach(() => resetRateLimits(app));

  afterEach(() => sinon.restore());

  it('does not count successful auth requests', async () => {
    for (let i = 0; i < ADMIN_AUTH_RATE_LIMIT_MAX_FAILED_ATTEMPTS + 1; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await request(app).get('/auth/uaa/callback').expect(302); // 302 Found (redirect)
    }

    const res = await request(app).get('/auth/unknown');

    expect(res.status).to.not.equal(429); // 429 Too Many Requests
  });

  it('rejects and logs admin requests over 100', async function apiLimitTest() {
    this.timeout(15000); // test runs longer than the default 2500ms timeout
    const warn = sinon.stub(logger, 'warn');

    const requests = [];
    for (let i = 0; i < ADMIN_API_RATE_LIMIT_MAX_REQUESTS + 1; i += 1) {
      requests.push(request(app).get('/sites'));
    }

    const responses = await Promise.all(requests);
    const limited = responses.filter(
      (res) => res.status === 429, // 429 Too Many Requests
    );

    expect(limited).to.have.lengthOf(1);
    expect(limited[0].body).to.deep.equal({
      error: 'Too many admin requests, please try again later.',
    });
    expect(warn.calledOnce).to.equal(true);
    expect(warn.firstCall.args[0]).to.match(
      /^Admin API rate limit exceeded: GET \/sites from /,
    );

    // applies the admin API limit to all admin routes, including /auth
    const authRes = await request(app).get('/auth/uaa/callback');
    expect(authRes.status).to.equal(429); // 429 Too Many Requests
  });

  it('rejects and logs failed auth attempts over 10', async () => {
    const warn = sinon.stub(logger, 'warn');

    for (let i = 0; i < ADMIN_AUTH_RATE_LIMIT_MAX_FAILED_ATTEMPTS; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await request(app).get('/auth/unknown');
    }

    const res = await request(app).get('/auth/unknown');
    expect(res.status).to.equal(429); // 429 Too Many Requests

    expect(res.body).to.deep.equal({ error: 'Too many authentication attempts.' });
    expect(warn.calledOnce).to.equal(true);
    expect(warn.firstCall.args[0]).to.match(
      /^Admin auth rate limit exceeded: GET \/auth\/unknown from /,
    );

    // applies the auth limit only to /auth routes
    await request(app).get('/sites').expect(401); // 401 Unauthorized
  });

  it('does not tell clients about the rate limits', async () => {
    const apiRes = await request(app).get('/sites').expect(401); // 401 Unauthorized
    const authRes = await request(app).get('/auth/uaa/callback');
    expect(authRes.status).to.equal(302); // 302 Found (redirect)

    [apiRes, authRes].forEach((res) => {
      expect(res.headers).to.not.have.any.keys(
        'ratelimit-limit',
        'ratelimit-remaining',
        'ratelimit-reset',
        'ratelimit-policy',
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'x-ratelimit-reset',
      );
    });
  });
});
