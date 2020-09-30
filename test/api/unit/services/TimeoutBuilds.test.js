const { expect } = require('chai');
const moment = require('moment');
const sinon = require('sinon');

const factory = require('../../support/factory');
const timeoutBuilds = require('../../../../api/services/TimeoutBuilds');
const { Build } = require('../../../../api/models');

describe('TimeoutBuilds', () => {
  afterEach(() => {
    sinon.restore();
    Build.truncate();
  });

  it('times out builds', async () => {
    const now = moment();
    const timeout = 45;

    const [b1, b2] = await Promise.all([
      // should be timed out
      factory.build({ state: 'processing', startedAt: now.clone().subtract(timeout + 22, 'minutes').toDate() }),
      factory.build({ state: 'processing', startedAt: now.clone().subtract(timeout + 20, 'minutes').toDate() }),
      // other
      factory.build(),
      factory.build({ state: 'processing', startedAt: now.toDate() }),
      factory.build({ state: 'processing', startedAt: now.clone().subtract(timeout - 1, 'minutes').toDate() }),
      // invalid states
      factory.build({ state: 'queued', startedAt: now.clone().subtract(timeout + 20, 'minutes').toDate() }),
      factory.build({ state: 'processing' }),
    ]);

    const result = await timeoutBuilds(now);

    expect(result[0]).to.equal(2);
    expect(result[1].map(b => b.id)).to.have.members([b1.id, b2.id]);

    await Promise.all([b1.reload(), b2.reload()]);

    [b1, b2].forEach((b) => {
      expect(b.state).to.equal('error');
      expect(b.error).to.equal('The build timed out');
      expect(b.completedAt.toString()).to.equal(now.toDate().toString());
    });
  });
});
