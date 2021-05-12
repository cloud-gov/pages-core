const { expect } = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const queueConfig = require('../../../api/workers/queueConfig');
const timeoutBuilds = require('../../../api/services/TimeoutBuilds');
const { revokeMembershipForInactiveUsers } = require('../../../api/services/FederalistUsersHelper');
const { nightlyBuilds } = require('../../../api/services/ScheduledBuildHelper');
const BuildLogs = require('../../../api/services/build-logs');

const NIGHTLY = '0 5 * * *';
const EVERY_TEN_MINUTES = '0,10,20,30,40,50 * * * *';

describe('queueConfig', () => {
  afterEach(() => {
    sinon.restore();
  });
  it('verify all jobs are present', () => {
    const queueNames = Object.keys(queueConfig);
    expect(queueNames.includes('nightlyBuilds'));
    expect(queueNames.includes('removeInactiveFederalistUsers'));
    expect(queueNames.includes('timeoutBuilds'));
    expect(queueNames.includes('archiveBuildLogs'));
    expect(queueNames.length).to.equal(4);
  });

  it('timeoutBuilds', () => {
    const queueName = 'timeoutBuilds';
    expect(queueConfig[queueName]['processJob']).equal(timeoutBuilds);
    expect(queueConfig[queueName].queueOptions).eql({ repeat: { cron: EVERY_TEN_MINUTES } });
  });

  it('removeInactiveFederalistUsers', () => {
    const queueName = 'removeInactiveFederalistUsers';
    expect(queueConfig[queueName]['processJob']).equal(revokeMembershipForInactiveUsers);
    expect(queueConfig[queueName].queueOptions).eql({ repeat: { cron: NIGHTLY } });
  });

  it('nightlyBuilds', async () => {
    const queueName = 'nightlyBuilds';
    expect(queueConfig[queueName]['processJob']).equal(nightlyBuilds);
    expect(queueConfig[queueName].queueOptions).eql({ repeat: { cron: NIGHTLY } });
  });

  it('archiveBuildLogs', async () => {
    const archiveStub = sinon.stub(BuildLogs, 'archiveBuildLogsByDate').resolves();
    const queueName = 'archiveBuildLogs';
    const startDate = moment().subtract(1, 'days').startOf('day');
    const endDate = startDate.clone().add(1, 'days');
    expect(archiveStub.called).to.be.false;
    await queueConfig[queueName].processJob();
    expect(archiveStub.called).to.be.true;
    expect(archiveStub.calledOnceWith(startDate.toDate(), endDate.toDate())).to.be.true;
    expect(queueConfig[queueName].queueOptions).eql({ repeat: { cron: NIGHTLY } });
  });
});