const { expect } = require('chai');
const { stub } = require('sinon');
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
    it('should send a build new build message', (done) => {
      factory.build()
        .then(build => build.completeJob())
        .then((build) => {
          const queuedBuild = sendMessageStub.getCall(0).args[0];
          const buildCount = sendMessageStub.getCall(0).args[1];

          expect(sendMessageStub.called).to.be.true;
          expect(queuedBuild.id).to.equal(build.id);
          expect(buildCount).to.equal(1);

          done();
        })
        .catch(done);
    });
  });

  describe('.completeJob(message)', () => {
    it('should mark a build successful if there is no error', (done) => {
      factory.build().then(build =>
        build.completeJob()
      ).then((build) => {
        expect(build.state).to.equal('success');
        expect(build.error).to.equal('');
        expect(new Date() - build.completedAt).to.be.below(1000);
        expect(build.completedAt.toISOString()).to.equal(build.toJSON().completedAt.toISOString());
        done();
      })
      .catch(done);
    });

    it('should mark a build errored with a message if the error is a string', (done) => {
      factory.build().then(build =>
        build.completeJob('this is an error')
      ).then((build) => {
        expect(build.state).to.equal('error');
        expect(build.error).to.equal('this is an error');
        done();
      })
      .catch(done);
    });

    it('should mark a build errored with the error\'s message if the error is an error object', (done) => {
      factory.build().then((build) => {
        const error = new Error('this is an error');
        return build.completeJob(error);
      }).then((build) => {
        expect(build.state).to.equal('error');
        expect(build.error).to.equal('this is an error');
        done();
      })
      .catch(done);
    });

    it('should update the site\'s publishedAt timestamp if the build is successful', (done) => {
      let site;

      const sitePromise = factory.site();
      Promise.props({
        site: sitePromise,
        build: factory.build({ site: sitePromise }),
      }).then((promisedValues) => {
        site = promisedValues.site;
        expect(site.publishedAt).to.be.null;

        return promisedValues.build.completeJob();
      }).then(() => Site.findByPk(site.id))
      .then((model) => {
        expect(model.publishedAt).to.be.a('date');
        expect(new Date().getTime() - model.publishedAt.getTime()).to.be.below(500);
        done();
      })
      .catch(done);
    });

    it('should sanitize GitHub access tokens from error message', (done) => {
      factory.build().then(build =>
        build.completeJob('http://123abc@github.com')
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
