const { expect } = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const BuildLogs = require('../../../api/services/build-logs');
const TimeoutBuilds = require('../../../api/services/TimeoutBuilds');
const ScheduledBuildHelper = require('../../../api/services/ScheduledBuildHelper');
const RepositoryVerifier = require('../../../api/services/RepositoryVerifier');
const FederalistUsersHelper = require('../../../api/services/FederalistUsersHelper');
const SandboxHelper = require('../../../api/services/SandboxHelper');
const SiteDestroyer = require('../../../api/services/SiteDestroyer');
const factory = require('../support/factory');
const jobProcessors = require('../../../api/workers/jobProcessors');

const job = { log: () => Promise.resolve() };

describe('job processors', () => {
  afterEach(() => {
    sinon.restore();
  });

  context('nightlyBuilds', () => {
    it('with failed builds', async () => {
      sinon.stub(ScheduledBuildHelper, 'nightlyBuilds').resolves([
        { status: 'fulfilled', value: '1' },
        { status: 'fulfilled', value: '2' },
        { status: 'rejected', reason: 'because' },
      ]);
      const result = await jobProcessors.nightlyBuilds().catch(e => e);
      expect(result).to.be.an('error');
      expect(result.message.split('.')[0]).to.equal('Queued nightly builds with 2 successes and 1 failures');
    });

    it('all successful builds', async () => {
      sinon.stub(ScheduledBuildHelper, 'nightlyBuilds').resolves([
        { status: 'fulfilled', value: '1' },
        { status: 'fulfilled', value: '2' },
      ]);
      const result = await jobProcessors.nightlyBuilds().catch(e => e);
      expect(result).to.not.be.an('error');
    });
  });

  context('timeoutBuilds', () => {
    it('with failed build cancellation', async () => {
      sinon.stub(TimeoutBuilds, 'timeoutBuilds').resolves([
        [1, { status: 'fulfilled', value: '1' }],
        [2, { status: 'fulfilled', value: '2' }],
        [3, { status: 'rejected', reason: 'because' }],
      ]);
      const result = await jobProcessors.timeoutBuilds().catch(e => e);
      expect(result).to.be.an('error');
      expect(result.message).to.equal('1 build tasks could not be canceled:\n3: because');
    });

    it('all builds canceled successfully', async () => {
      sinon.stub(TimeoutBuilds, 'timeoutBuilds').resolves([
        [1, { status: 'fulfilled', value: '1' }],
        [2, { status: 'fulfilled', value: '2' }],
        [3, { status: 'fulfilled', value: '3' }],
      ]);
      const result = await jobProcessors.timeoutBuilds();
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
      const result = await jobProcessors.archiveBuildLogsDaily(job);
      expect(result).to.not.be.an('error');
    });

    it('fails to archive successfully', async () => {
      sinon.stub(BuildLogs, 'archiveBuildLogsForBuildId').rejects('erred out');
      const result = await jobProcessors.archiveBuildLogsDaily(job).catch(e => e);
      expect(result).to.be.an('error');
      const dateStr = moment().subtract(1, 'days').startOf('day').format('YYYY-MM-DD');
      expect(result.message.split(',')[0]).to
        .equal(`Archive build logs for ${dateStr} completed with the following errors:`);
    });
  });

  context('verifyRepos', () => {
    it('with unverified repos', async () => {
      sinon.stub(RepositoryVerifier, 'verifyRepos').resolves([
        { status: 'fulfilled', value: '1' },
        { status: 'fulfilled', value: '2' },
        { status: 'rejected', reason: 'because' },
      ]);
      const result = await jobProcessors.verifyRepositories().catch(e => e);
      expect(result).to.be.an('error');
      expect(result.message.split('.')[0]).to.equal('Repositories verified with 2 successes and 1 failures');
    });

    it('all repos verified successfully', async () => {
      sinon.stub(RepositoryVerifier, 'verifyRepos').resolves([
        { status: 'fulfilled', value: '1' },
        { status: 'fulfilled', value: '2' },
      ]);
      const result = await jobProcessors.verifyRepositories().catch(e => e);
      expect(result).to.not.be.an('error');
    });
  });

  context('revokeMembershipForInactiveUsers', () => {
    it('failed to remove all inactive members', async () => {
      sinon.stub(FederalistUsersHelper, 'revokeMembershipForInactiveUsers').resolves([
        { status: 'fulfilled', value: '1' },
        { status: 'fulfilled', value: '2' },
        { status: 'rejected', reason: 'because' },
      ]);
      const result = await jobProcessors.revokeMembershipForInactiveUsers().catch(e => e);
      expect(result).to.be.an('error');
      expect(result.message.split('.')[0]).to.equal('Invactive federalist-users removed with 2 successes and 1 failures');
    });

    it('removed all inactive members successfully', async () => {
      sinon.stub(FederalistUsersHelper, 'revokeMembershipForInactiveUsers').resolves([
        { status: 'fulfilled', value: '1' },
        { status: 'fulfilled', value: '2' },
      ]);
      const result = await jobProcessors.revokeMembershipForInactiveUsers().catch(e => e);
      expect(result).to.not.be.an('error');
    });
  });

  context('sandboxNotifications', () => {
    it('failed to notify all sandbox organization members', async () => {
      sinon.stub(SandboxHelper, 'notifyOrganizations').resolves([
        { status: 'fulfilled', value: '1' },
        { status: 'fulfilled', value: '2' },
        { status: 'rejected', reason: 'because' },
      ]);
      const result = await jobProcessors.sandboxNotifications().catch(e => e);
      expect(result).to.be.an('error');
      expect(result.message.split('.')[0]).to.equal('Sandbox organization reminders queued with 2 successes and 1 failures');
    });

    it('notify all sandbox organization members successfully', async () => {
      sinon.stub(SandboxHelper, 'notifyOrganizations').resolves([
        { status: 'fulfilled', value: '1' },
        { status: 'fulfilled', value: '2' },
      ]);
      const result = await jobProcessors.sandboxNotifications().catch(e => e);
      expect(result).to.not.be.an('error');
    });
  });

  context('cleanSandboxOrganizations', () => {
    it('notify all sandbox organization members successfully', async () => {
      sinon.stub(SandboxHelper, 'cleanSandboxes').resolves([
        { status: 'fulfilled', value: 'cleaned' },
        { status: 'fulfilled', value: 'cleaned' },
      ]);
      const result = await jobProcessors.cleanSandboxOrganizations();
      expect(result).to.not.be.an('error');
    });

    it('failed ot clean sandbox organization', async () => {
      sinon.stub(SandboxHelper, 'cleanSandboxes').resolves([
        { status: 'fulfilled', value: 'cleaned' },
        { status: 'rejected', reason: 'just because' },
      ]);

      const result = await jobProcessors.cleanSandboxOrganizations().catch(e => e);
      expect(result).to.be.an('error');
      expect(result.message).to.equal([
        'Sandbox organizations cleaned with 1 successes and 1 failures.',
        '   Successes:\n      cleaned\n   Failures:\n      just because',
      ].join('\n'));
    });
  });

  describe('multiJobProcessor', () => {
    context('when a job processor exists for the job', () => {
      it('invokes the correct job processor', async () => {
        const jobName = 'job';
        const job = { name: jobName };
        const processor = sinon.stub().resolves();

        await jobProcessors.multiJobProcessor({ [jobName]: processor })(job);

        sinon.assert.calledOnceWithExactly(processor, job);
      });
    });

    context('when a job processor does not exist for the job', () => {
      it('throws an error', async () => {
        const job = { name: 'foo' };

        const error = await jobProcessors.multiJobProcessor({})(job).catch(e => e);

        expect(error).to.be.an('error');
        expect(error.message).to.eq(`No processor found for job type: ${job.name}.`);
      });
    });
  });

  context('destroySiteInfra', () => {
    const destroySiteJob = {
      site: {
        id: 1,
        owner: 'test',
        repository: 'repo',
      },
      user: {},
    };
    it('with failures', async () => {
      sinon.stub(SiteDestroyer, 'destroySiteInfra').resolves([
        { status: 'fulfilled', value: '1' },
        { status: 'fulfilled', value: '2' },
        { status: 'rejected', reason: 'because' },
      ]);
      const result = await jobProcessors.destroySiteInfra(destroySiteJob).catch(e => e);
      expect(result).to.be.an('error');
      expect(result.message.split('.')[0]).to.equal('Site deletion failed for id: 1 - test/repo');
      // TODO: this should also check for mailer/slack
    });

    it('with no failures', async () => {
      sinon.stub(SiteDestroyer, 'destroySiteInfra').resolves([
        { status: 'fulfilled', value: '1' },
        { status: 'fulfilled', value: '2' },
      ]);
      const result = await jobProcessors.destroySiteInfra(destroySiteJob).catch(e => e);
      expect(result).to.not.be.an('error');
    });
  });
});
