const { expect } = require('chai');
const { stub } = require('sinon');
const { DatabaseError, ValidationError } = require('sequelize');
const SQS = require('../../../../api/services/SQS');
const factory = require('../../support/factory');
const { Build, Site } = require('../../../../api/models');

// eslint-disable-next-line scanjs-rules/call_setTimeout
const wait = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

describe('Build model', () => {
  let sendMessageStub;

  beforeEach(() => {
    sendMessageStub = stub(SQS, 'sendBuildMessage');
  });

  afterEach(() => {
    sendMessageStub.restore();
  });

  describe('before validate hook', () => {
    it('should add a build token', async () => {
      const site = await factory.site();
      const build = await Build.build({ site: site.id, user: 1 });

      await build.validate();

      expect(build.token).to.exist;
    });

    it('should not override a build token if one exists', async () => {
      const site = await factory.site();
      const build = await Build.build({ site: site.id, token: '123abc', user: 1 });

      build.validate();

      expect(build.token).to.equal('123abc');
    });
  });

  describe('after create hook', () => {
    it('should send a build new build message', async () => {
      const site = await factory.site();
      const uev = await factory.userEnvironmentVariable.create({ site });
      const build = await factory.build({ site }, true);

      // create delay while s3 infra created ... will be removed with 1 bucket federalist
      await wait();

      expect(build.completedAt).to.be.null;
      expect(build.startedAt).to.be.null;

      const [queuedBuild, buildCount] = sendMessageStub.getCall(0).args;

      expect(sendMessageStub.called).to.be.true;
      expect(queuedBuild.id).to.equal(build.id);
      expect(buildCount).to.equal(1);
      expect(build.state).to.eql('queued');

      // The build should include the site
      expect(queuedBuild.Site).to.be.an.instanceof(Site);
      expect(queuedBuild.Site.id).to.eq(site.id);

      // The site should include the environment variables
      expect(queuedBuild.Site.UserEnvironmentVariables).to.be.an.instanceof(Array);
      expect(queuedBuild.Site.UserEnvironmentVariables[0].id).to.eq(uev.id);
    });
  });

  describe('.updateJobStatus', () => {
    describe('from `queued`', () => {
      let build;

      beforeEach(async () => {
        build = await factory.build();
      });

      describe('to `processing`', () => {
        it('should update the startedAt and state', async () => {
          await build.updateJobStatus({ status: 'processing' });

          expect(build.state).to.equal('processing');
          expect(build.startedAt).to.be.a('date');
          expect(build.startedAt).to.be.above(build.createdAt);
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
          expect(build.completedAt).to.be.above(build.createdAt);
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
          build = await build.updateJobStatus({ status: 'success' });

          expect(build.state).to.be.eql('success');
          expect(build.completedAt).to.be.a('date');
          expect(build.completedAt).to.be.above(build.startedAt);

          const site = await Site.findByPk(build.site);

          expect(site.publishedAt).to.be.a('date');
          expect(build.completedAt.getTime()).to.eql(site.publishedAt.getTime());
          const url = [
            `https://${site.awsBucketName}.app.cloud.gov`,
            `/preview/${site.owner}/${site.repository}/${build.branch}`,
          ].join('');
          expect(build.url).to.eql(url);
        });
      });

      describe('to `error`', () => {
        it('should mark a build errored with a message', async () => {
          await build.updateJobStatus({ status: 'error', message: 'this is an error' });

          expect(build.state).to.equal('error');
          expect(build.error).to.equal('this is an error');
          expect(build.startedAt.getTime()).to.equal(startedAt.getTime());
          expect(build.completedAt).to.be.a('date');
          expect(build.completedAt).to.be.above(build.startedAt);
        });
      });
    });
  });

  describe('validations', () => {
    it('should require a site object before saving', () => {
      const buildPromise = Build.create({ user: 1, site: null });

      return expect(buildPromise).to.be
        .rejectedWith(ValidationError, 'notNull Violation: Build.site cannot be null');
    });

    it('should require a user object before saving', () => {
      const buildPromise = Build.create({ user: null, site: 1 });

      return expect(buildPromise).to.be
        .rejectedWith(ValidationError, 'notNull Violation: Build.user cannot be null');
    });

    it('should require a valid sha before saving', () => {
      const buildPromise = Build.create({
        user: 1,
        site: 1,
        commitSha: 'not-a-real-sha.biz',
      });

      return expect(buildPromise).to.be
        .rejectedWith(ValidationError, 'Validation error: Validation is on commitSha failed');
    });

    it('requires a valid branch name before saving', () => {
      const buildPromise = Build.create({
        user: 1,
        site: 1,
        commitSha: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
        branch: 'not*real',
      });

      return expect(buildPromise).to.be
        .rejectedWith(ValidationError, 'Validation error: Validation is on branch failed');
    });

    it('requires a valid branch name before saving no end slash', () => {
      const buildPromise = Build.create({
        user: 1,
        site: 1,
        commitSha: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
        branch: 'not-real/',
      });

      return expect(buildPromise).to.be
        .rejectedWith(ValidationError, 'Validation error: Validation is on branch failed');
    });

    it('requires a valid branch name before saving no begin /', () => {
      const buildPromise = Build.create({
        user: 1,
        site: 1,
        commitSha: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
        branch: '/not-real',
      });

      return expect(buildPromise).to.be
        .rejectedWith(ValidationError, 'Validation error: Validation is on branch failed');
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
});
