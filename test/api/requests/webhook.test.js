const crypto = require('crypto');
const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon');
const request = require('supertest');
const app = require('../../../app');
const config = require('../../../config');
const factory = require('../support/factory');
const githubAPINocks = require('../support/githubAPINocks');
const { Build, Site, User, Event } = require('../../../api/models');
const SQS = require('../../../api/services/SQS');
const EventCreator = require('../../../api/services/EventCreator');
const GithubBuildHelper = require('../../../api/services/GithubBuildHelper');

const Webhooks = require('../../../api/services/Webhooks');

describe('Webhook API', () => {
  const signWebhookPayload = (payload) => {
    const { secret } = config.webhook;
    const blob = JSON.stringify(payload);
    return `sha1=${crypto.createHmac('sha1', secret).update(blob).digest('hex')}`;
  };

  const buildWebhookPayload = (user, site, pushedAt = new Date().getTime()/1000) => ({
    ref: 'refs/heads/main',
    commits: [{ id: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7' }],
    after: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
    sender: { login: user.username },
    repository: { full_name: `${site.owner}/${site.repository}`, pushed_at: pushedAt },
  });

  const organizationWebhookPayload = (action, login, organization='federalist-users') => ({
    action,
    membership: {
      user: {
        login,
      },
    },
    organization: {
      login: organization,
      id: 123,
    }
  });

  let errorStub;
  let auditStub;
  beforeEach(() => {
    errorStub = sinon.stub(EventCreator, 'error').resolves();
    auditStub = sinon.stub(EventCreator, 'audit').resolves();
  });

  afterEach(() => {
    sinon.restore();
  });
  
  describe('POST /webhook/github', () => {
    let pushWebhookRequestStub;
    beforeEach(() => {
      pushWebhookRequestStub = sinon.stub(Webhooks, 'pushWebhookRequest').resolves();
    });

    it('should respond with a 400 if the signature is invalid', async () => {
      const site = await factory.site();
      await site.reload({ include: [User] });

      const payload = buildWebhookPayload(site.Users[0], site);
      const signature = '123abc';

      await request(app)
        .post('/webhook/github')
        .send(payload)
        .set({
          'X-GitHub-Event': 'push',
          'X-Hub-Signature': signature,
          'X-GitHub-Delivery': '123abc',
        })
        .expect(400);
      
      sinon.assert.notCalled(pushWebhookRequestStub);
    });

    it('should call `pushWebhookRequest` with the payload if ok', async () => {
      const user = await factory.user();
      const site = await factory.site({ users: [user] });

      const payload = buildWebhookPayload(user, site);
      const signature = signWebhookPayload(payload);

      await request(app)
        .post('/webhook/github')
        .send(payload)
        .set({
          'X-GitHub-Event': 'push',
          'X-Hub-Signature': signature,
          'X-GitHub-Delivery': '123abc',
        })
        .expect(200);

      sinon.assert.calledWith(pushWebhookRequestStub, payload);
    });
  });

  describe('POST /webhook/organization', () => {
    let organizationWebhookRequestStub;
    beforeEach(() => {
      organizationWebhookRequestStub = sinon.stub(Webhooks, 'organizationWebhookRequest').resolves();
    });

    it('should respond with a 400 if the signature is invalid', async () => {
      const payload = organizationWebhookPayload('member_added', 'username');
      const signature = '123abc';

      await request(app)
        .post('/webhook/organization')
        .send(payload)
        .set({
          'X-GitHub-Event': 'push',
          'X-Hub-Signature': signature,
          'X-GitHub-Delivery': '123abc',
        })
        .expect(400);
      
      sinon.assert.notCalled(organizationWebhookRequestStub);
    });

    it('should call `pushWebhookRequest` with the payload if ok', async () => {
      const payload = organizationWebhookPayload('member_added', 'username');
      const signature = signWebhookPayload(payload);

      await request(app)
        .post('/webhook/organization')
        .send(payload)
        .set({
          'X-GitHub-Event': 'push',
          'X-Hub-Signature': signature,
          'X-GitHub-Delivery': '123abc',
        })
        .expect(200);

      sinon.assert.calledWith(organizationWebhookRequestStub, payload);
    });
  });
});
