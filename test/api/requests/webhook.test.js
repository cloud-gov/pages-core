const { expect } = require('chai');
const crypto = require('crypto');
const sinon = require('sinon');
const request = require('supertest');
const app = require('../../../app');
const config = require('../../../config');
const factory = require('../support/factory');
const { createSiteUserOrg } = require('../support/site-user');
const EventCreator = require('../../../api/services/EventCreator');
const Webhooks = require('../../../api/services/Webhooks');
const Encryptor = require('../../../api/services/Encryptor');
const { encryption } = require('../../../config');
const QueueJobs = require('../../../api/queue-jobs');

describe('Webhook API', () => {
  const signWebhookPayload = (payload) => {
    const { secret } = config.webhook;
    const blob = JSON.stringify(payload);
    return `sha1=${crypto.createHmac('sha1', secret).update(blob).digest('hex')}`;
  };

  const buildWebhookPayload = (user, site, pushedAt = new Date().getTime() / 1000) => ({
    ref: 'refs/heads/main',
    commits: [
      {
        id: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
      },
    ],
    after: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
    sender: {
      login: user.username,
    },
    repository: {
      full_name: `${site.owner}/${site.repository}`,
      pushed_at: pushedAt,
    },
  });

  const organizationWebhookPayload = (
    action,
    login,
    organization = 'federalist-users',
  ) => ({
    action,
    membership: {
      user: {
        login,
      },
    },
    organization: {
      login: organization,
      id: 123,
    },
  });

  beforeEach(() => {
    sinon.stub(EventCreator, 'error').resolves();
    sinon.stub(EventCreator, 'audit').resolves();
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
      const { site, user } = await createSiteUserOrg();

      const payload = buildWebhookPayload(user, site);
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

    context('should call `pushWebhookRequest` with the payload if ok', () => {
      it('site is in not in an organization', async () => {
        const { site, user } = await createSiteUserOrg();

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

      it('site does not exist', async () => {
        const { site, user } = await createSiteUserOrg();

        const payload = buildWebhookPayload(user, site);
        const signature = signWebhookPayload(payload);
        await site.destroy();
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

    it('site is in an active organization', async () => {
      const { site, user } = await createSiteUserOrg();

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

    it('site is in an inactive organization', async () => {
      const org = await factory.organization.create({ isActive: false });
      const { site, user } = await createSiteUserOrg({ org });

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

    it('site is inactive', async () => {
      const site = await factory.site({
        isActive: false,
      });
      const { user } = await createSiteUserOrg({ site });

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
      organizationWebhookRequestStub = sinon
        .stub(Webhooks, 'organizationWebhookRequest')
        .resolves();
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

  describe('POST /webhook/site', () => {
    it('should respon with a 200 with valid payload', async () => {
      const userEmail = 'user@agency.gov';
      const apiKey = 'an-api-key';
      const siteId = '123';
      const siteName = 'site';
      const org = 'org';
      const payload = Encryptor.encryptObjectValues(
        { userEmail, apiKey, siteId, siteName, org },
        encryption.key,
      );

      const stub = sinon
        .stub(QueueJobs.prototype, 'startCreateEditorSiteTask')
        .resolves();

      await request(app).post('/webhook/site').send(payload).expect(200);

      expect(
        stub.calledOnceWith({
          userEmail,
          apiKey,
          siteId,
          siteName,
          orgName: org,
        }),
      ).to.be.equal(true);
    });

    it('should respond with a 400 if payload is invalid', async () => {
      const payload = { bad: 'payload' };

      await request(app).post('/webhook/site').send(payload).expect(400);
    });
  });

  describe('POST /webhook/site/build', () => {
    it('should respon with a 200 with valid payload', async () => {
      const siteId = '123';
      const payload = Encryptor.encryptObjectValues({ siteId }, encryption.key);

      const stub = sinon.stub(Webhooks, 'createBuildForEditor').resolves();

      await request(app).post('/webhook/site/build').send(payload).expect(200);
      expect(stub.calledOnceWith(siteId)).to.be.equal(true);
    });

    it('should respond with a 400 if payload is invalid', async () => {
      const payload = { bad: 'payload' };

      await request(app).post('/webhook/site/build').send(payload).expect(400);
    });
  });
});
