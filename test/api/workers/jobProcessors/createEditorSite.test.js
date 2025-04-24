const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const SiteCreator = require('../../../../api/services/SiteCreator');
const { QueueEvents } = require('bullmq');
const QueueWorker = require('../../../../api/workers/QueueWorker');
const Mailer = require('../../../../api/workers/Mailer');
const {
  Build,
  Organization,
  Site,
  User,
  UserEnvironmentVariable,
} = require('../../../../api/models');
const {
  CreateEditorSiteQueue,
  CreateEditorSiteQueueName,
} = require('../../../../api/queues');
const jobProcessors = require('../../../../api/workers/jobProcessors');
const factory = require('../../support/factory');
const { promisedQueueEvents } = require('../../support/queues');
const { createQueueConnection } = require('../../../../api/utils/queues');

const testJobOptions = {
  sleepNumber: 0,
  totalAttempts: 240,
};

async function cleanDb() {
  return Promise.all([
    Build.truncate(),
    Organization.truncate(),
    Site.truncate({
      force: true,
      cascade: true,
    }),
    User.truncate({
      force: true,
      cascade: true,
    }),
  ]);
}

describe('createEditorSite', () => {
  before(async () => {
    const email = 'ops@example.gov';
    process.env.OPS_EMAIL = email;
    await factory.userWithUAAIdentity.create({ email });
  });

  after(async () => {
    await cleanDb();
  });

  describe('Expected Worker Output', () => {
    const connection = createQueueConnection();
    // eslint-disable-next-line no-unused-vars
    const worker = new QueueWorker(CreateEditorSiteQueueName, connection, (job) =>
      jobProcessors.createEditorSite(job, testJobOptions),
    );

    // Set the queue to only attempt jobs once for testing
    const queue = new CreateEditorSiteQueue(connection, { attempts: 1 });
    const queueEvents = new QueueEvents(CreateEditorSiteQueueName, { connection });

    afterEach(async () => {
      await queue.obliterate({
        force: true,
      });
      await sinon.restore();
    });

    it('should successfully create editor site', async () => {
      let pagesSiteId;
      const siteId = '123';
      const siteName = 'agency-test-site';
      const apiKey = '1234abcd';
      const orgName = 'agency-org';

      sinon.stub(SiteCreator, 'createSite').callsFake(async ({ siteParams }) => {
        const site = await factory.site({ organizationId: siteParams.organizationId });
        pagesSiteId = site.id;
        return site;
      });

      const webhookPost = sinon.spy();
      sinon.stub(axios, 'create').returns({ post: webhookPost });

      const job = await queue.add('sendTaskMessage', {
        siteId,
        siteName,
        apiKey,
        orgName,
      });

      const result = await promisedQueueEvents(queueEvents, 'completed');
      expect(result.jobId).to.equal(job.id);

      const webhookArgs = webhookPost.getCall(0).args;
      expect(webhookArgs[0]).to.equal(`/${siteId}`);
      expect(webhookArgs[1]).to.have.property('siteId');
      expect(webhookArgs[1]).to.have.property('orgId');
      expect(webhookPost.calledOnce).to.equal(true);

      const siteEnvVars = await UserEnvironmentVariable.findAll({
        where: { siteId: pagesSiteId },
      });
      expect(siteEnvVars.length).to.equal(2);
      siteEnvVars.map((envVar) => {
        expect(envVar.name).to.be.oneOf(['PAYLOAD_API_KEY', 'EDITOR_APP_URL']);
      });
    });

    it('should successfully create editor site in existing org', async () => {
      let pagesSiteId;
      const siteId = '123';
      const siteName = 'agency-test-with-org';
      const orgName = 'agency-org';
      const apiKey = '1234abcd';

      await factory.organization.create({ name: `editor-${orgName}-${siteName}` });

      sinon.stub(SiteCreator, 'createSite').callsFake(async ({ siteParams }) => {
        const site = await factory.site({ organizationId: siteParams.organizationId });
        pagesSiteId = site.id;
        return site;
      });

      const webhookPost = sinon.spy();
      sinon.stub(axios, 'create').returns({ post: webhookPost });

      const job = await queue.add('sendTaskMessage', {
        siteId,
        siteName,
        apiKey,
        orgName,
      });

      const result = await promisedQueueEvents(queueEvents, 'completed');
      expect(result.jobId).to.equal(job.id);

      const webhookArgs = webhookPost.getCall(0).args;
      expect(webhookArgs[0]).to.equal(`/${siteId}`);
      expect(webhookArgs[1]).to.have.property('siteId');
      expect(webhookArgs[1]).to.have.property('orgId');
      expect(webhookPost.calledOnce).to.equal(true);

      const siteEnvVars = await UserEnvironmentVariable.findAll({
        where: { siteId: pagesSiteId },
      });
      expect(siteEnvVars.length).to.equal(2);
      siteEnvVars.map((envVar) => {
        expect(envVar.name).to.be.oneOf(['PAYLOAD_API_KEY', 'EDITOR_APP_URL']);
      });
    });

    it('should email ops if an error occurs', async () => {
      const siteId = '123';
      const siteName = 'agency-test-error';
      const apiKey = '1234abcd';

      sinon.stub(SiteCreator, 'createSite').rejects();

      const mailerStub = sinon.stub(Mailer.prototype, 'send').resolves();

      const job = await queue.add('sendTaskMessage', {
        siteId,
        siteName,
        apiKey,
      });

      const result = await promisedQueueEvents(queueEvents, 'failed');
      expect(result.jobId).to.equal(job.id);

      expect(mailerStub.calledOnce).to.equal(true);

      const mailerArgs = mailerStub.getCall(0).args[0];
      expect(mailerArgs.to).to.equal(process.env.OPS_EMAIL);
      expect(mailerArgs.subject).to.equal('Error Creating New Editor Site');
    });
  });
});
