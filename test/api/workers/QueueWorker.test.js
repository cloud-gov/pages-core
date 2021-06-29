const { expect } = require('chai');
const sinon = require('sinon');
const QueueWorker = require('../../../api/workers/QueueWorker');
const { done } = require('fetch-mock');
const factory = require('../support/factory');
const jobProcessors = require('../../../api/workers/jobProcessors');

describe('Scheduled', () => {
  afterEach(() => {
    sinon.restore();
  });
  describe('ScheduledWorker', () => {
    it('scheduled worker is instantiated', (done) => {
      const worker = new QueueWorker.QueueWorker('theTest');
      expect(worker.worker.name).to.equal('theTest');
      expect(worker.connection.status).to.equal('connecting');
      expect(worker.QUEUE_NAME).to.equal('theTest');
      expect(worker.queueEvents.name).to.equal('theTest');
      expect(worker.scheduler.name).to.equal('theTest');
      done();
    });

    describe('processJob', () => {
      it('nightlyJobs', async () => {
        const stub = sinon.stub(jobProcessors, 'nightlyBuilds').resolves();
        const job = { name: 'nightlyBuilds' };
        await QueueWorker.processJob(job);
        expect(stub.called).to.be.true;
      });

      it('timeoutBuilds', async () => {
        const stub = sinon.stub(jobProcessors, 'timeoutBuilds').resolves();
        const job = { name: 'timeoutBuilds' };
        await QueueWorker.processJob(job);
        expect(stub.called).to.be.true;
      });

      it('archiveBuildLogsDaily', async () => {
        const stub = sinon.stub(jobProcessors, 'archiveBuildLogsDaily').resolves();
        const job = { name: 'archiveBuildLogsDaily' };
        await QueueWorker.processJob(job);
        expect(stub.called).to.be.true;
      });

      it('verifyRepos', async () => {
        const stub = sinon.stub(jobProcessors, 'verifyRepositories').resolves();
        const job = { name: 'verifyRepositories' };
        await QueueWorker.processJob(job);
        expect(stub.called).to.be.true;
      });

      it('revokeMembershipForInactiveUsers', async () => {
        const stub = sinon.stub(jobProcessors, 'revokeMembershipForInactiveUsers').resolves();
        const job = { name: 'revokeMembershipForInactiveUsers' };
        await QueueWorker.processJob(job);
        expect(stub.called).to.be.true;
      });

      it('invalid job name', async () => {
        const job = { name: 'invalid job name' };
        const result = await QueueWorker.processJob(job).catch(e => e);
        expect(result).to.be.an('error');
        expect(result.message).to.equal(`No processor found for job@name=${job.name}.`);
      });
    });
  });
});