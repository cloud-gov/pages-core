const { expect } = require('chai');
const sinon = require('sinon');
const ScheduledWorker = require('../../../api/workers/scheduled');
const { done } = require('fetch-mock');
const factory = require('../support/factory');
const jobProcessor = require('../../../api/workers/jobProcessor');

describe('Scheduled', () => {
  afterEach(() => {
    sinon.restore();
  });
  describe('ScheduledWorker', () => {
    it('scheduled worker is instantiated', (done) => {
      const worker = new ScheduledWorker.ScheduledWorker('theTest');
      expect(worker.worker.name).to.equal('theTest');
      expect(worker.connection.status).to.equal('connecting');
      expect(worker.QUEUE_NAME).to.equal('theTest');
      expect(worker.queueEvents.name).to.equal('theTest');
      expect(worker.scheduler.name).to.equal('theTest');
      done();
    });

    describe('processJob', () => {
      it('nightlyJobs', async () => {
        const stub = sinon.stub(jobProcessor, 'runNightlyBuilds').resolves();
        const job = { name: 'nightlyBuilds' };
        await ScheduledWorker.processJob(job);
        expect(stub.called).to.be.true;
      });

      it('timeoutBuilds', async () => {
        const stub = sinon.stub(jobProcessor, 'runTimeoutBuilds').resolves();
        const job = { name: 'timeoutBuilds' };
        await ScheduledWorker.processJob(job);
        expect(stub.called).to.be.true;
      });

      it('archiveBuildLogsDaily', async () => {
        const stub = sinon.stub(jobProcessor, 'runArchiveBuildLogsDaily').resolves();
        const job = { name: 'archiveBuildLogsDaily' };
        await ScheduledWorker.processJob(job);
        expect(stub.called).to.be.true;
      });

      it('verifyRepos', async () => {
        const stub = sinon.stub(jobProcessor, 'runVerifyRepos').resolves();
        const job = { name: 'verifyRepos' };
        await ScheduledWorker.processJob(job);
        expect(stub.called).to.be.true;
      });

      it('revokeMembershipForInactiveUsers', async () => {
        const stub = sinon.stub(jobProcessor, 'runRevokeMembershipForInactiveUsers').resolves();
        const job = { name: 'revokeMembershipForInactiveUsers' };
        await ScheduledWorker.processJob(job);
        expect(stub.called).to.be.true;
      });

      it('invalid job name', async () => {
        const job = { name: 'invalid job name' };
        const result = await ScheduledWorker.processJob(job).catch(e => e);
        expect(result).to.be.an('error');
        expect(result.message).to.equal(`No processor found for job@name=${job.name}.`);
      });
    });
  });
});