const { expect } = require('chai');
const { stub } = require('sinon');
const _ = require('underscore');
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
    it('should add a build token', (done) => {
      let build;

      factory.site().then((site) => {
        build = Build.build({
          site: site.id,
          user: 1,
        });

        return build.validate();
      }).then(() => {
        expect(build.token).to.be.okay;
        done();
      })
      .catch(done);
    });

    it('should not override a build token if one exists', (done) => {
      let build;

      factory.site().then((site) => {
        build = Build.build({
          site: site.id,
          token: '123abc',
          user: 1,
        });
        return build.validate();
      }).then(() => {
        expect(build.token).to.equal('123abc');
        done();
      })
      .catch(done);
    });
  });

  describe('after create hook', () => {
    it('should send a build new build message', async() => {
      const startedAt = new Date();
      let build = await factory.build();
      // create delay while s3 infra create will be removed with 1 bucket federalist
      await factory.site();
      expect(build.completedAt).to.be.null;
      expect(build.startedAt).to.be.null;

      const queuedBuild = sendMessageStub.getCall(0).args[0];
      const buildCount = sendMessageStub.getCall(0).args[1];

      expect(sendMessageStub.called).to.be.true;
      expect(queuedBuild.id).to.equal(build.id);
      expect(buildCount).to.equal(1);
      expect(build.state).to.eql('queued');
    });
  });

  describe('.updateJobStatus', () => {
    describe('.completeJob(message)', () => {
      it('should mark a build errored with a message', (done) => {
        factory.build()
          .then((build) => {
            expect(build.state).to.eql('queued');
            expect(build.startedAt).to.be.null;
            return build.updateJobStatus({ status: 'processing' });
          })
          .then((build) => {
            expect(build.completedAt).to.be.null;
            expect(build.startedAt).to.be.a('date');
            expect(build.startedAt.getTime()).to.above(build.createdAt);
            return build.updateJobStatus({ status: 'error', message: 'this is an error' });
          }).then((build) => {
            expect(build.state).to.equal('error');
            expect(build.error).to.equal('this is an error');
            expect(build.completedAt).to.be.a('date');
            expect(build.completedAt.getTime()).to.above(build.startedAt.getTime());
            return Site.findByPk(build.site);
          }).then((site) => {
            expect(site.publishedAt).to.be.null;
            done();
          })
          .catch(done);
      });

      it('should update the site\'s publishedAt timestamp if the build is successful', (done) => {
        factory.build()
        .then((build) => {
          expect(build.state).to.eql('queued');
          expect(build.startedAt).to.be.null;
          return build.updateJobStatus({ status: 'processing' });
        }).then((build) => {
          expect(build.completedAt).to.be.null;
          expect(build.startedAt).to.be.a('date');
          expect(build.startedAt.getTime()).to.above(build.createdAt.getTime());
          return build.updateJobStatus({ status: 'success' });
        }).then((build) => {
          expect(build.completedAt).to.be.a('date');
          expect(build.completedAt.getTime()).to.above(build.startedAt.getTime());
          expect(build.state).to.be.eql('success');
          return Promise.all([Promise.resolve(build), Site.findByPk(build.site)]);
        }).then(([build, site]) => {
          expect(site.publishedAt).to.be.a('date');
          expect(build.completedAt.getTime()).to.eql(site.publishedAt.getTime());
          done();
        })
        .catch(done);
      });
    });

    it('should sanitize GitHub access tokens from error message', (done) => {
      factory.build().then(build =>
        build.updateJobStatus({ status: 'error', message: 'http://123abc@github.com' })
      ).then((build) => {
        expect(build.state).to.equal('error');
        expect(build.error).not.to.match(/123abc/);
        done();
      })
      .catch(done);
    });
  });

  describe('validations', () => {
    it('should require a site object before saving', (done) => {
      Build.create({
        user: 1,
        site: null,
      }).then(() =>
        done(new Error('Expected a validation error'))
      ).catch((err) => {
        expect(err.name).to.equal('SequelizeValidationError');
        expect(err.errors[0].path).to.equal('site');
        done();
      })
      .catch(done);
    });

    it('should require a user object before saving', (done) => {
      Build.create({
        user: null,
        site: 1,
      }).then(() =>
        done(new Error('Expected a validation error'))
      ).catch((err) => {
        expect(err.name).to.equal('SequelizeValidationError');
        expect(err.errors[0].path).to.equal('user');
        done();
      })
      .catch(done);
    });

    it('should require a valid sha before saving', (done) => {
      Build.create({
        user: 1,
        site: 1,
        commitSha: 'not-a-real-sha.biz',
      })
      .then(done)
      .catch((error) => {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].path).to.equal('commitSha');
        done();
      });
    });

    it('requires a valid branch name before saving', (done) => {
      Build.create({
        user: 1,
        site: 1,
        commitSha: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
        branch: 'not*real',
      })
      .then(done)
      .catch((error) => {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].path).to.equal('branch');
        done();
      });
    });
    it('requires a valid branch name before saving no end slash', (done) => {
      Build.create({
        user: 1,
        site: 1,
        commitSha: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
        branch: 'not-real/',
      })
      .then(done)
      .catch((error) => {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].path).to.equal('branch');
        done();
      });
    });
    it('requires a valid branch name before saving no begin /', (done) => {
      Build.create({
        user: 1,
        site: 1,
        commitSha: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
        branch: '/not-real',
      })
      .then(done)
      .catch((error) => {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].path).to.equal('branch');
        done();
      });
    });
  });
});
