const { expect } = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const ScheduledWorker = require('../../../api/workers/scheduled');
const BuildLogs = require('../../../api/services/build-logs');
const TimeoutBuilds = require('../../../api/services/TimeoutBuilds');
const ScheduledBuildHelper = require('../../../api/services/ScheduledBuildHelper');
const RepositoryVerifier = require('../../../api/services/RepositoryVerifier');
const FederalistUsersHelper = require('../../../api/services/FederalistUsersHelper');
const { done } = require('fetch-mock');
const factory = require('../support/factory');
const jobProcessor = require('../../../api/workers/jobProcessor');

describe('Scheduled', () => {
  afterEach(() => {
    sinon.restore();
  })
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
        // const stub = sinon.stub(ScheduledWorker, 'runTimeoutBuilds').resolves();
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
        sinon.stub(jobProcessor, 'runArchiveBuildLogsDaily').resolves();
        const job = { name: 'invalid job name' };
        const result = await ScheduledWorker.processJob(job).catch(e => e);
        expect(result).to.be.an('error');
        expect(result.message).to.equal(`No processor found for job@name=${job.name}.`);
      });
    });

    describe('job processors', () => {
      context('runNightlyBuilds', () => {
        it('with failed builds', async () => {
          sinon.stub(ScheduledBuildHelper, 'nightlyBuilds').resolves([
            { status: 'fulfilled', value: '1' },
            { status: 'fulfilled', value: '2' },
            { status: 'rejected', reason: 'because' },
          ]);
          const result = await jobProcessor.runNightlyBuilds().catch(e => e);
          expect(result).to.be.an('error');
          expect(result.message.split('.')[0]).to.equal('Queued nightly builds with 2 successes and 1 failures');
        });

        it('all successful builds', async () => {
          sinon.stub(ScheduledBuildHelper, 'nightlyBuilds').resolves([
            { status: 'fulfilled', value: '1' },
            { status: 'fulfilled', value: '2' },
          ]);
          const result = await jobProcessor.runNightlyBuilds().catch(e => e);
          expect(result).to.not.be.an('error');
        });
      });

      context('runTimeoutBuilds', () => {
        it('with failed build cancellation', async () => {
          sinon.stub(TimeoutBuilds, 'timeoutBuilds').resolves([
            [1, { status: 'fulfilled', value: '1' }],
            [2, { status: 'fulfilled', value: '2' }],
            [3, { status: 'rejected', reason: 'because' }],
          ]);
          const result = await jobProcessor.runTimeoutBuilds().catch(e => e);
          expect(result).to.be.an('error');
          expect(result.message).to.equal('1 build tasks could not be canceled:\n3: because');
        });

        it('all builds canceled successfully', async () => {
          sinon.stub(TimeoutBuilds, 'timeoutBuilds').resolves([
            [1, { status: 'fulfilled', value: '1' }],
            [2, { status: 'fulfilled', value: '2' }],
            [3, { status: 'fulfilled', value: '3' }],
          ]);
          const result = await jobProcessor.runTimeoutBuilds();
          expect(result).to.not.be.an('error');
        });
      });

      context('archiveBuildLogsDaily', () => {
        before(async () => {
          const completedAt = moment().subtract(1, 'days');
          await factory.build({ completedAt });
          await factory.build({ completedAt });
        });

        it('all archived successfully', async () => {
          sinon.stub(BuildLogs, 'archiveBuildLogsForBuildId').resolves();
          const result = await jobProcessor.runArchiveBuildLogsDaily();
          expect(result).to.not.be.an('error');
        });

        it('fails to archive successfully', async () => {
          sinon.stub(BuildLogs, 'archiveBuildLogsForBuildId').rejects('erred out');
          const result = await jobProcessor.runArchiveBuildLogsDaily().catch(e => e);
          expect(result).to.be.an('error');
          const dateStr = moment().subtract(1, 'days').startOf('day').format('YYYY-MM-DD');
          expect(result.message.split(',')[0]).to
            .equal(`Archive build logs for ${dateStr} completed with the following errors:`)
        });
      });

      context('runVerifyRepos', () => {
        it('with unverified repos', async () => {
          sinon.stub(RepositoryVerifier, 'verifyRepos').resolves([
            { status: 'fulfilled', value: '1' },
            { status: 'fulfilled', value: '2' },
            { status: 'rejected', reason: 'because' },
          ]);
          const result = await jobProcessor.runVerifyRepos().catch(e => e);
          expect(result).to.be.an('error');
          expect(result.message.split('.')[0]).to.equal('Repositories verified with 2 successes and 1 failures');
        });

        it('all repos verified successfully', async () => {
          sinon.stub(RepositoryVerifier, 'verifyRepos').resolves([
            { status: 'fulfilled', value: '1' },
            { status: 'fulfilled', value: '2' },
          ]);
          const result = await jobProcessor.runVerifyRepos().catch(e => e);
          expect(result).to.not.be.an('error');
        });
      });
    });

    context('runRemoveInactiveFederalistUsers', () => {
      it('failed to remove all inactive members', async () => {
        sinon.stub(FederalistUsersHelper, 'revokeMembershipForInactiveUsers').resolves([
          { status: 'fulfilled', value: '1' },
          { status: 'fulfilled', value: '2' },
          { status: 'rejected', reason: 'because' },
        ]);
        const result = await jobProcessor.runRevokeMembershipForInactiveUsers().catch(e => e);
        expect(result).to.be.an('error');
        expect(result.message.split('.')[0]).to.equal('Invactive federalist-users removed with 2 successes and 1 failures');
      });

      it('removed all inactive members successfully', async () => {
        sinon.stub(FederalistUsersHelper, 'revokeMembershipForInactiveUsers').resolves([
          { status: 'fulfilled', value: '1' },
          { status: 'fulfilled', value: '2' },
        ]);
        const result = await jobProcessor.runRevokeMembershipForInactiveUsers().catch(e => e);
        expect(result).to.not.be.an('error');
      });
    });
  });
});