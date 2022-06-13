const { expect } = require('chai');
const moment = require('moment');
const sinon = require('sinon');

const factory = require('../../support/factory');
const { timeoutBuilds } = require('../../../../api/services/TimeoutBuilds');
const { Build, sequelize } = require('../../../../api/models');
const CFApi = require('../../../../api/utils/cfApiClient');

const { Processing, Queued, Tasked } = Build.States;

function setBuildUpdatedAt(build, date) {
  return sequelize.query(
    'UPDATE build set "updatedAt" = ? WHERE id = ?',
    { replacements: [date, build.id] }
  ).then(() => build.reload());
}

describe('TimeoutBuilds', () => {
  let cancelBuildTaskStub;

  beforeEach(() => {
    cancelBuildTaskStub = sinon.stub(CFApi.prototype, 'cancelBuildTask');
  });

  afterEach(() => {
    sinon.restore();
    Build.truncate();
  });

  it('times out the correct builds', async () => {
    const error = new Error('foo');
    cancelBuildTaskStub
      .onFirstCall()
      .resolves()
      .onSecondCall()
      .rejects(error)
      .onThirdCall()
      .resolves();

    const now = moment();
    const timeout = 45;

    const [b1, b2] = await Promise.all([
      // should be timed out
      factory.build({ state: Processing, startedAt: now.clone().subtract(timeout + 22, 'minutes').toDate() }),
      factory.build({ state: Processing, startedAt: now.clone().subtract(timeout + 20, 'minutes').toDate() }),
      factory.build({ state: Tasked })
        .then(build => setBuildUpdatedAt(build, now.clone().subtract(6, 'minutes').toDate())),

      // other
      factory.build(),
      factory.build({ state: Processing, startedAt: now.toDate() }),
      factory.build({ state: Processing, startedAt: now.clone().subtract(timeout - 1, 'minutes').toDate() }),
      factory.build({ state: Tasked })
        .then(build => setBuildUpdatedAt(build, now.clone().subtract(3, 'minutes').toDate())),

      // invalid states
      factory.build({ state: Queued, startedAt: now.clone().subtract(timeout + 20, 'minutes').toDate() }),
      factory.build({ state: Processing }),
    ]);

    const results = await timeoutBuilds(now);

    expect(results.length).to.equal(2);
    expect(results.map(r => r[0])).to.have.members([b1.id, b2.id]);
    expect(results.map(r => r[1])).to.have.deep.members([
      { status: 'fulfilled', value: undefined },
      { status: 'rejected', reason: error },
    ]);

    await Promise.all([b1.reload(), b2.reload()]);

    sinon.assert.calledTwice(cancelBuildTaskStub);

    [b1, b2].forEach((b) => {
      expect(b.state).to.equal('error');
      expect(b.error).to.equal('The build timed out');
      expect(b.completedAt.toString()).to.equal(now.toDate().toString());
      sinon.assert.calledWithExactly(cancelBuildTaskStub, b.id);
    });
  });
});
