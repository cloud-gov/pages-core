const { expect } = require('chai');
const { stub } = require('sinon');
const { DatabaseError, ValidationError } = require('sequelize');
const SQS = require('../../../../api/services/SQS');
const factory = require('../../support/factory');
const { Build, Site } = require('../../../../api/models');

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

      build.validate();

      expect(build.token).to.be.okay;
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
      const build = await factory.build();
      await build.updateJobStatus({ status: 'complete' });
        
      const [queuedBuild, buildCount] = sendMessageStub.getCall(0).args;

      expect(sendMessageStub.called).to.be.true;
      expect(queuedBuild.id).to.equal(build.id);
      expect(buildCount).to.equal(1);
    });
  });

  describe('.completeJob(message)', () => {
    it('should mark a build errored with a message', async () => {
      const build = await factory.build();
      await build.updateJobStatus({ status: 'error', message: 'this is an error' });

      expect(build.state).to.equal('error');
      expect(build.error).to.equal('this is an error');
    });

    it('should update the site\'s publishedAt timestamp if the build is successful', async () => {
      const site = await factory.site();
      const build = await factory.build({ site: site });
      
      expect(site.publishedAt).to.be.null;

      await build.updateJobStatus({ status: 'success' });
      await site.reload();

      expect(site.publishedAt).to.be.a('date');
      expect(new Date().getTime() - site.publishedAt.getTime()).to.be.below(500);
    });

    it('should sanitize GitHub access tokens from error message', async () => {
      const build = await factory.build();
      await build.updateJobStatus({ status: 'error', message: 'http://123abc@github.com' });
      
      expect(build.state).to.equal('error');
      expect(build.error).not.to.match(/123abc/);
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
        commitSha: 'not-a-real-sha.biz'
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

  describe('forUser scope', () => {
    it('returns the build for the associated user', async () => {
      const user = await factory.user();
      const build = await factory.build({ user });

      const buildQuery = await Build.forUser(user).findByPk(build.id);

      expect(buildQuery).to.not.be.null;
      expect(buildQuery.id).to.equal(build.id);
    });

    it('does not return the build for a different user', async () => {
      const user = { id: 99999 };
      const build = await factory.build();

      const buildQuery = await Build.forUser(user).findByPk(build.id);

      expect(buildQuery).to.be.null;
    });
  });
});
