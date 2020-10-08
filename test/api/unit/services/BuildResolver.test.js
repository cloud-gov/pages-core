const { expect } = require('chai');
const sinon = require('sinon');
const factory = require('../../support/factory');
const BuildResolver = require('../../../../api/services/BuildResolver');
const GitHub = require('../../../../api/services/GitHub');
const buildErrors = require('../../../../api/responses/buildErrors');

describe('BuildResolver', () => {
  let ghStub;
  beforeEach(() => {
    ghStub = sinon.stub(GitHub, 'getBranch');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('returns a 404 when a build cannot be found by build id', (done) => {
    const user = factory.user();
    const site = factory.site({ users: Promise.all([user]) });
    let values;

    Promise.props({
      user,
      site,
    })
    .then((response) => {
      values = response;
      return BuildResolver.getBuild(values.user, {
        buildId: 1,
        siteId: values.site.id,
      });
    })
    .then(() => {
      done();
    })
    .catch((err) => {
      expect(err.status).to.equal(404);
      expect(err.message).to.equal(buildErrors.BUILD_NOT_FOUND);
      done();
    });
  });

  it('finds a build when passed build and site ids', (done) => {
    const user = factory.user();
    const site = factory.site({ users: Promise.all([user]) });
    const build = factory.build({ site });
    let values;

    Promise.props({
      user,
      site,
      build,
    })
    .then((response) => {
      values = response;
      return BuildResolver.getBuild(values.user, {
        buildId: values.build.id,
        siteId: values.site.id,
      });
    })
    .then((response) => {
      expect(response.id).to.equal(values.build.id);
      done();
    })
    .catch(done);
  });

  it('finds a build by branch name', (done) => {
    const branch = 'staging';
    const sha = '123abc';
    const user = factory.user();
    const site = factory.site({ users: Promise.all([user]) });
    const build = factory.build({ site, branch });

    Promise.props({
      user,
      site,
      build,
    })
    .then(values =>
      BuildResolver.getBuild(values.user, {
        branch,
        siteId: values.site.id,
        sha,
      })
    )
    .then((response) => {
      expect(response.branch).to.equal(branch);
      expect(response.commitSha).to.equal(sha);
      done();
    })
    .catch(done);
  });

  describe('checking for branch on github', () => {
    const branch = 'staging';
    const sha = '123abc';

    it('calls out to github if the branch cannot be found locally', async () => {
      const user = await factory.user();
      const site = await factory.site({ users: Promise.resolve([user]) });

      ghStub.resolves({
        name: branch,
        commit: {
          sha,
        },
      });

      const build = await BuildResolver.getBuild(user, {
        branch,
        siteId: site.id,
        sha,
      });

      expect(build.branch).to.equal(branch);
      expect(build.commitSha).to.equal(sha);
    });

    it('returns a 404 when a build cannot be started because branch does not exist', async () => {
      const user = await factory.user();
      const site = await factory.site({ users: Promise.resolve([user]) });

      ghStub.rejects();

      const err = await BuildResolver.getBuild(user, {
        branch,
        siteId: site.id,
        sha,
      })
        .catch(e => e);

      expect(err.status).to.equal(404);
      expect(err.message).to.equal(buildErrors.BRANCH_NOT_FOUND);
    });
  });
});
