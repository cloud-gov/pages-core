const { expect } = require('chai');
const moment = require('moment');
const { Op } = require('sequelize');

const factory = require('../../support/factory');
const { runFailStuckBuilds } = require('../../../../api/services/FailStuckBuilds');
const { Build, BuildLog, sequelize } = require('../../../../api/models');

const { Created, Processing, Queued, Tasked } = Build.States;

function setBuildUpdatedAt(build, date) {
  return sequelize
    .query('UPDATE build set "updatedAt" = ? WHERE id = ?', {
      replacements: [date, build.id],
    })
    .then(() => build.reload());
}

describe('FailStuckBuilds', () => {
  beforeEach(() => {
    BuildLog.truncate();
    Build.truncate();
  });

  afterEach(() => {
    BuildLog.truncate();
    Build.truncate();
  });

  it('fails builds that have been created or tasked for over 10 minutes', async () => {
    const now = moment();

    const [b1, b2, b3] = await Promise.all([
      // should be failed
      factory
        .build({
          state: Created,
        })
        .then((build) =>
          setBuildUpdatedAt(build, now.clone().subtract(11, 'minutes').toDate()),
        ),
      factory
        .build({
          state: Created,
        })
        .then((build) =>
          setBuildUpdatedAt(build, now.clone().subtract(20, 'minutes').toDate()),
        ),
      factory
        .build({
          state: Tasked,
        })
        .then((build) =>
          setBuildUpdatedAt(build, now.clone().subtract(20, 'minutes').toDate()),
        ),

      // should be ignored
      factory.build({
        state: Created,
      }),
      factory.build({
        state: Tasked,
      }),
      factory.build({
        state: Processing,
      }),
      factory
        .build({
          state: Processing,
        })
        .then((build) =>
          setBuildUpdatedAt(build, now.clone().subtract(20, 'minutes').toDate()),
        ),
      factory
        .build({
          state: Queued,
        })
        .then((build) =>
          setBuildUpdatedAt(build, now.clone().subtract(20, 'minutes').toDate()),
        ),
    ]);

    const results = await runFailStuckBuilds();
    const buildIds = results.map((r) => r.id);
    const logs = await BuildLog.findAll({
      attributes: ['build', 'source', 'output'],
      where: {
        build: {
          [Op.in]: buildIds,
        },
      },
    });

    expect(results.length).to.equal(3);
    expect(buildIds).to.have.members([b1.id, b2.id, b3.id]);
    expect(results.map((r) => r.state)).to.include('error');
    expect(logs.map((l) => l.source)).to.include('ALL');
    expect(logs.map((l) => l.output)).to.include(
      'An error occurred while trying to build this branch. Please rebuild branch.',
    );
  });

  it(`fails no builds because none have been
      created or tasked for over 10 minutes`, async () => {
    const builds = await Promise.all([
      factory.build({
        state: Created,
      }),
      factory.build({
        state: Tasked,
      }),
      factory.build({
        state: Processing,
      }),
      factory.build({
        state: Queued,
      }),
    ]);

    const results = await runFailStuckBuilds();

    expect(results).to.be.equal(null);
    expect(builds).to.have.length(4);
  });
});
