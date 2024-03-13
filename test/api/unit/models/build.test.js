const { expect } = require('chai');
const sinon = require('sinon');
const { DatabaseError, ValidationError } = require('sequelize');
const SiteBuildQueue = require('../../../../api/services/SiteBuildQueue');
const factory = require('../../support/factory');
const { Build, Site, BuildTask } = require('../../../../api/models');
const config = require('../../../../config');

describe('Build model', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('before validate hook', () => {
    it('should add a build token', async () => {
      const site = await factory.site();
      const build = await Build.build({ site: site.id, user: 1, username: 'username', branch: 'branch' });

      await build.validate();

      expect(build.token).to.exist;
    });

    it('should not override a build token if one exists', async () => {
      const site = await factory.site();
      const build = await Build.build({ site: site.id, token: '123abc', username: 'username', branch: 'branch' });

      build.validate();

      expect(build.token).to.equal('123abc');
    });
  });

  describe('enqueue', () => {
    it('should send a build new build message', async () => {
      const sendMessageStub = sinon.stub(SiteBuildQueue, 'sendBuildMessage');
      sendMessageStub.resolves();

      const site = await factory.site();
      const uev = await factory.userEnvironmentVariable.create({ site });
      const build = await factory.build({ site });
      await build.enqueue();

      await build.reload();

      expect(build.completedAt).to.be.null;
      expect(build.startedAt).to.be.null;

      const [queuedBuild, buildCount] = sendMessageStub.getCall(0).args;

      expect(sendMessageStub.called).to.be.true;
      expect(queuedBuild.id).to.equal(build.id);
      expect(buildCount).to.equal(1);
      expect(build.state).to.equal('queued');

      // The build should include the site
      expect(queuedBuild.Site).to.be.an.instanceof(Site);
      expect(queuedBuild.Site.id).to.eq(site.id);

      // The site should include the environment variables
      expect(queuedBuild.Site.UserEnvironmentVariables).to.be.an.instanceof(Array);
      expect(queuedBuild.Site.UserEnvironmentVariables[0].id).to.eq(uev.id);
    });
  });

  describe('.updateJobStatus', () => {
    describe('from `created`', () => {
      let build;

      beforeEach(async () => {
        build = await factory.build({ state: 'created' });
      });

      describe('to `processing`', () => {
        it('should update the startedAt and state', async () => {
          await build.updateJobStatus({ status: 'processing' });

          expect(build.state).to.equal('processing');
          expect(build.startedAt).to.be.a('date');
          expect(build.startedAt).to.be.at.least(build.createdAt);
          expect(build.completedAt).to.be.null;
        });
      });

      describe('to `error`', () => {
        it('should mark a build errored with a message', async () => {
          await build.updateJobStatus({ status: 'error', message: 'this is an error' });

          expect(build.state).to.equal('error');
          expect(build.error).to.equal('this is an error');
          expect(build.startedAt).to.be.null;
          expect(build.completedAt).to.be.a('date');
          expect(build.completedAt).to.be.at.least(build.createdAt);
        });

        it('should sanitize GitHub access tokens from error message', async () => {
          await build.updateJobStatus({ status: 'error', message: 'http://123abc@github.com' });

          expect(build.error).not.to.match(/123abc/);
        });
      });
    });
    describe('from `queued`', () => {
      let build;

      beforeEach(async () => {
        build = await factory.build({ state: 'queued' });
      });

      describe('to `processing`', () => {
        it('should update the startedAt and state', async () => {
          await build.updateJobStatus({ status: 'processing' });

          expect(build.state).to.equal('processing');
          expect(build.startedAt).to.be.a('date');
          expect(build.startedAt).to.be.at.least(build.createdAt);
          expect(build.completedAt).to.be.null;
        });
      });

      describe('to `error`', () => {
        it('should mark a build errored with a message', async () => {
          await build.updateJobStatus({ status: 'error', message: 'this is an error' });

          expect(build.state).to.equal('error');
          expect(build.error).to.equal('this is an error');
          expect(build.startedAt).to.be.null;
          expect(build.completedAt).to.be.a('date');
          expect(build.completedAt).to.be.at.least(build.createdAt);
        });

        it('should sanitize GitHub access tokens from error message', async () => {
          await build.updateJobStatus({ status: 'error', message: 'http://123abc@github.com' });

          expect(build.error).not.to.match(/123abc/);
        });
      });
    });

    describe('from `tasked`', () => {
      let build;

      beforeEach(async () => {
        build = await factory.build({ state: 'tasked' });
      });

      describe('to `processing`', () => {
        it('should update the startedAt and state', async () => {
          await build.updateJobStatus({ status: 'processing' });

          expect(build.state).to.equal('processing');
          expect(build.startedAt).to.be.a('date');
          expect(build.startedAt).to.be.at.least(build.createdAt);
          expect(build.completedAt).to.be.null;
        });
      });

      describe('to `error`', () => {
        it('should mark a build errored with a message', async () => {
          await build.updateJobStatus({ status: 'error', message: 'this is an error' });

          expect(build.state).to.equal('error');
          expect(build.error).to.equal('this is an error');
          expect(build.startedAt).to.be.null;
          expect(build.completedAt).to.be.a('date');
          expect(build.completedAt).to.be.at.least(build.createdAt);
        });

        it('should sanitize GitHub access tokens from error message', async () => {
          await build.updateJobStatus({ status: 'error', message: 'http://123abc@github.com' });

          expect(build.error).not.to.match(/123abc/);
        });
      });
    });

    describe('from `processing`', () => {
      const startedAt = new Date();
      let build;

      beforeEach(async () => {
        build = await factory.build({ status: 'processing', startedAt, branch: 'some-branch' });
      });

      describe('to `success`', () => {
        it('should update the site\'s publishedAt timestamp if the build is successful', async () => {
          const commitSha = 'abcdef0123456789001234567890012345678901';
          build = await build.updateJobStatus({ status: 'success', commitSha });

          expect(build.state).to.be.eql('success');
          expect(build.completedAt).to.be.a('date');
          expect(build.completedAt).to.be.above(build.startedAt);
          expect(build.startedAt.getTime()).to.equal(startedAt.getTime());
          expect(build.clonedCommitSha).to.equal(commitSha);

          const site = await Site.findByPk(build.site);

          expect(site.publishedAt).to.be.a('date');
          expect(build.completedAt.getTime()).to.eql(site.publishedAt.getTime());
          const url = [
            `https://${site.awsBucketName}.${config.app.proxyDomain}`,
            `/preview/${site.owner}/${site.repository}/${build.branch}`,
          ].join('');
          expect(build.url).to.eql(url);
        });
      });

      describe('to `error`', () => {
        it('should mark a build errored with a message and w/o commitSha', async () => {
          await build.updateJobStatus({ status: 'error', message: 'this is an error' });

          expect(build.state).to.equal('error');
          expect(build.error).to.equal('this is an error');
          expect(build.startedAt.getTime()).to.equal(startedAt.getTime());
          expect(build.completedAt).to.be.a('date');
          expect(build.completedAt).to.be.above(build.startedAt);
          expect(build.clonedCommitSha).to.be.null;
        });

        it('should mark a build errored with a message and commitSha', async () => {
          const commitSha = 'abcdef0123456789001234567890012345678901';
          const message = 'this is an error with commitsha';
          await build.updateJobStatus({ status: 'error', message , commitSha });

          expect(build.state).to.equal('error');
          expect(build.error).to.equal(message);
          expect(build.startedAt.getTime()).to.equal(startedAt.getTime());
          expect(build.clonedCommitSha).to.equal(commitSha);
          expect(build.completedAt).to.be.a('date');
          expect(build.completedAt).to.be.above(build.startedAt);
        });
      });
    });
  });

  describe('validations', () => {
    const branchNameError = 'Validation error: Invalid branch name — branches can only contain alphanumeric characters, underscores, and hyphens.'
    const branchNameLengthError = 'Validation error: Invalid branch name — branch names are limitted to 299 characters.'

    it('should require a site object before saving', () => {
      const buildPromise = Build.create({ user: 1, site: null });

      return expect(buildPromise).to.be
        .rejectedWith(ValidationError, 'notNull Violation: Build.site cannot be null');
    });

    it('should require a username before saving', () => {
      const buildPromise = Build.create({ username: null, site: 1 });

      return expect(buildPromise).to.be
        .rejectedWith(ValidationError, 'notNull Violation: Build.username cannot be null');
    });

    it('should require a valid requestedCommitSha before saving', () => {
      const buildPromise = Build.create({
        user: 1,
        site: 1,
        requestedCommitSha: 'not-a-real-sha.biz',
      });

      return expect(buildPromise).to.be
        .rejectedWith(ValidationError, 'Validation error: Validation is on requestedCommitSha failed');
    });

    it('should require a valid clonedCommitSha before saving', () => {
      const buildPromise = Build.create({
        user: 1,
        site: 1,
        clonedCommitSha: 'not-a-real-sha.biz',
      });

      return expect(buildPromise).to.be
        .rejectedWith(ValidationError, 'Validation error: Validation is on clonedCommitSha failed');
    });

    it('should require a branch before saving', () => {
      const buildPromise = Build.create({ username: 'username', site: 1, branch: null });

      return expect(buildPromise).to.be
        .rejectedWith(ValidationError, 'notNull Violation: Build.branch cannot be null');
    });

    it('requires a valid branch name before saving', () => {
      const buildPromise = Build.create({
        user: 1,
        site: 1,
        requestedCommitSha: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
        branch: 'not*real',
      });

      return expect(buildPromise).to.be
        .rejectedWith(ValidationError, branchNameError);
    });

    it('requires a valid branch name before saving no end slash', () => {
      const buildPromise = Build.create({
        user: 1,
        site: 1,
        requestedCommitSha: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
        branch: 'not-real/',
      });

      return expect(buildPromise).to.be
        .rejectedWith(ValidationError, branchNameError);
    });

    it('requires a valid branch name before saving no begin /', () => {
      const buildPromise = Build.create({
        user: 1,
        site: 1,
        requestedCommitSha: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
        branch: '/not-real',
      });

      return expect(buildPromise).to.be
        .rejectedWith(ValidationError, branchNameError);
    });

    it('requires a valid branch name before saving and it cannot be >= 300 characters /', () => {
      const branch = Array(301).join("b")
      const buildPromise = Build.create({
        user: 1,
        site: 1,
        requestedCommitSha: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
        branch,
      });

      return expect(buildPromise).to.be
        .rejectedWith(ValidationError, branchNameLengthError);
    });
  });

  describe('querying', () => {
    it('does not return a build when pk is null', async () => {
      const pk = null;

      const buildQuery = await Build.findByPk(pk);

      expect(buildQuery).to.be.null;
    });

    it('returns a build when pk is a string', async () => {
      const build = await factory.build();
      const pk = String(build.id);

      const buildQuery = await Build.findByPk(pk);

      expect(buildQuery).to.not.be.null;
      expect(buildQuery.id).to.equal(build.id);
    });

    it('throws when pk is Nan', () => {
      const pk = NaN;

      const buildQuery = Build.findByPk(pk);

      return expect(buildQuery).to.be.rejectedWith(DatabaseError);
    });

    it('throws when pk is non-number string', () => {
      const pk = 'foobar';

      const buildQuery = Build.findByPk(pk);

      return expect(buildQuery).to.be.rejectedWith(DatabaseError);
    });
  });

  describe('.orgScope()', () => {
    it('returns builds by organization', async () => {
      const organizationA = await factory.organization.create({name: 'Org A'});
      const siteA = await factory.site({organizationId: organizationA.id });
      const buildA1 = await factory.build({site: siteA.id});
      const buildA2 = await factory.build({site: siteA.id});

      const siteAA = await factory.site({organizationId: organizationA.id });
      const buildAA = await factory.build({site: siteAA.id});

      const organizationB = await factory.organization.create({name: 'Org B'});
      const siteB = await factory.site({organizationId: organizationB.id });
      const buildB = await factory.build({site: siteB.id});

      const siteD = await factory.site(); // Site without an Organization
      const buildD = await factory.build({site: siteD.id});

      const result = await Build.scope(Build.orgScope(organizationA.id)).findAll();

      expect(result.map(build => build.id)).to.have.members([buildA1.id, buildA2.id, buildAA.id]);
      expect(result.map(build => build.id)).to.not.have.members([buildB.id, buildD.id]);
    });
  });

  describe('forSiteUser scope', () => {
    it('returns the build for the associated user', async () => {
      const user = await factory.user();
      const build = await factory.build({ user });

      const buildQuery = await Build.forSiteUser(user).findByPk(build.id);

      expect(buildQuery).to.not.be.null;
      expect(buildQuery.id).to.equal(build.id);
    });

    it('returns the build for any user who has access to the site', async () => {
      const [user1, user2] = await Promise.all([factory.user(), factory.user()]);
      const site = await factory.site({ users: [user1, user2] });
      const build = await factory.build({ user: user1, site });

      const buildQuery = await Build.forSiteUser(user2).findByPk(build.id);

      expect(buildQuery).to.not.be.null;
      expect(buildQuery.id).to.equal(build.id);
    });

    it('does not return the build for a different user', async () => {
      const user = { id: 99999 };
      const build = await factory.build();

      const buildQuery = await Build.forSiteUser(user).findByPk(build.id);

      expect(buildQuery).to.be.null;
    });
  });

  describe('model hooks', () => {
    it('creates build tasks on afterCreate hook', async () => {
      // prep
      const site = factory.site();
      const buildTaskType = await factory.buildTaskType();
      await factory.siteBuildTask({
        siteId: site, buildTaskTypeId: buildTaskType,
      });

      // create the build
      const build = await factory.build({ site });

      // now we should have a new build task
      const buildTasks = await BuildTask.findAll({ where: { buildId: build.id } })
      expect(buildTasks).to.have.length(1);

      const task = buildTasks[0];
      expect(task.buildTaskTypeId).to.equal(buildTaskType.id);
      expect(task.buildId).to.equal(build.id);
    });
  });
});
