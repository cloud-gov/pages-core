const { expect } = require('chai');
const crypto = require('crypto');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('webhook validation middleware', () => {
  const secret = 'test-webhook-secret';
  let router;

  beforeEach(() => {
    const controller = sinon.stub();
    router = proxyquire('../../../../api/routers/webhook', {
      '../../config': {
        webhook: { secret, gitlabSecret: secret },
        '@noCallThru': true,
      },
      '../controllers/webhook': {
        github: controller,
        gitlab: controller,
        organization: controller,
        site: controller,
        siteDelete: controller,
        siteBuild: controller,
        '@noCallThru': true,
      },
    });
  });

  const validate = (path, req) => {
    const middleware = router.stack.find((layer) => layer.route.path === path).route
      .stack[0].handle;
    const res = { badRequest: sinon.spy() };
    const next = sinon.spy();
    middleware(req, res, next);
    return { res, next };
  };

  const expectRejectedOnce = ({ res, next }) => {
    sinon.assert.calledOnce(res.badRequest);
    sinon.assert.calledOnce(next);
    expect(next.firstCall.args[0]).to.be.instanceOf(Error);
  };

  it('calls next only once with an error for an invalid GitHub signature', () => {
    expectRejectedOnce(
      validate('/webhook/github', {
        body: {},
        headers: { 'x-hub-signature': 'invalid' },
      }),
    );
  });

  it('calls next only once with an error for an invalid GitLab token', () => {
    expectRejectedOnce(
      validate('/webhook/gitlab', {
        headers: { 'x-gitlab-token': 'invalid' },
      }),
    );
  });

  it('calls next only once with an error for an invalid editor payload', () => {
    expectRejectedOnce(validate('/webhook/site', { body: {} }));
  });

  it('continues normally for a valid GitHub signature', () => {
    const body = { message: 'test' };
    const signature = crypto
      .createHmac('sha1', secret)
      .update(JSON.stringify(body))
      .digest('hex');
    const { res, next } = validate('/webhook/github', {
      body,
      headers: { 'x-hub-signature': `sha1=${signature}` },
    });
    sinon.assert.notCalled(res.badRequest);
    sinon.assert.calledOnceWithExactly(next);
  });

  it('continues normally for a valid GitLab token', () => {
    const { res, next } = validate('/webhook/gitlab', {
      headers: { 'x-gitlab-token': secret },
    });
    sinon.assert.notCalled(res.badRequest);
    sinon.assert.calledOnceWithExactly(next);
  });

  it('continues normally for a valid editor payload', () => {
    const { res, next } = validate('/webhook/site/build', { body: { siteId: 1 } });
    sinon.assert.notCalled(res.badRequest);
    sinon.assert.calledOnceWithExactly(next);
  });
});
