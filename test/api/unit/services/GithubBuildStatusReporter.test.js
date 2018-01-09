const crypto = require('crypto');
const { expect } = require('chai');
const nock = require('nock');
const config = require('../../../../config');
const factory = require('../../support/factory');
const githubAPINocks = require('../../support/githubAPINocks');
const { User } = require('../../../../api/models');

const GithubBuildStatusReporter = require('../../../../api/services/GithubBuildStatusReporter');

const commitSha = 'a172b66c31e19d456a448041a5b3c2a70c32d8b7';

describe('GithubBuildStatusReporter', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('reportBuildStatus(build)', () => {
    context('with a build in the processing state', () => {
      it("should report that the status is 'pending'", (done) => {
        let statusNock;

        factory.build({
          state: 'processing',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          commitSha,
        }).then((build) => {
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            repository: 'test-repo',
            sha: commitSha,
            state: 'pending',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(statusNock.isDone()).to.be.true;
          done();
        }).catch(done);
      });

      it('should set the target uri to the build logs', (done) => {
        let statusNock;

        factory.build({
          state: 'processing',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          commitSha,
        }).then((build) => {
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: commitSha,
            targetURL: `${config.app.hostname}/sites/${build.site}/builds/${build.id}/logs`,
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(statusNock.isDone()).to.be.true;
          done();
        }).catch(done);
      });
    });

    context('with every build', () => {
      const origAppEnv = config.app.app_env;
      after(() => {
        // reset config.app.app_env to its original value
        config.app.app_env = origAppEnv;
      });

      it('should set status context to "federalist/build" when APP_ENV is "production"', (done) => {
        let statusNock;

        factory.build({
          state: 'success',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          commitSha,
        }).then((build) => {
          config.app.app_env = 'production';
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: commitSha,
            state: 'success',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(statusNock.isDone()).to.be.true;
          done();
        }).catch(done);
      });
    });

    context('with a build in the success state', () => {
      it("should report that the status is 'success'", (done) => {
        let statusNock;

        factory.build({
          state: 'success',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          commitSha,
        }).then((build) => {
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: commitSha,
            state: 'success',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(statusNock.isDone()).to.be.true;
          done();
        }).catch(done);
      });

      it('should set the target uri to the preview link', (done) => {
        let statusNock;

        factory.build({
          state: 'success',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          commitSha,
          branch: 'preview-branch',
        }).then((build) => {
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: commitSha,
            targetURL: `${config.app.preview_hostname}/preview/test-owner/test-repo/preview-branch/`,
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(statusNock.isDone()).to.be.true;
          done();
        }).catch(done);
      });
    });

    context('with a build in the error state', () => {
      it("should report that the status is 'error'", (done) => {
        let statusNock;

        factory.build({
          state: 'error',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          commitSha,
        }).then((build) => {
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: commitSha,
            state: 'error',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(statusNock.isDone()).to.be.true;
          done();
        }).catch(done);
      });

      it('should set the target uri to the build logs', (done) => {
        let statusNock;

        factory.build({
          state: 'error',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          commitSha,
        }).then((build) => {
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: commitSha,
            targetURL: `${config.app.hostname}/sites/${build.site}/builds/${build.id}/logs`,
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(statusNock.isDone()).to.be.true;
          done();
        }).catch(done);
      });
    });

    context('with a build by a Federalist user', () => {
      it("should use the GitHub access token of the build's user", (done) => {
        let statusNock;

        factory.build({
          state: 'error',
          user: factory.user({ githubAccessToken: 'federalist-user-access-token' }),
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          commitSha,
        }).then((build) => {
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: commitSha,
            accessToken: 'federalist-user-access-token',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(statusNock.isDone()).to.be.true;
          done();
        }).catch(done);
      });
    });

    context('with a build by a user outside Federalist', () => {
      it("should use the access token of the site's most recently signed in user", (done) => {
        let statusNock;

        const federalistUser = factory.user({
          githubAccessToken: 'fallback-access-token',
          signedInAt: new Date(),
        });
        const githubUserName = `github-user-${crypto.randomBytes(8).toString('hex')}`;
        const githubUser = User.create({ username: githubUserName });
        const site = factory.site({
          owner: 'test-owner',
          repository: 'test-repo',
          users: Promise.all([federalistUser, githubUser]),
        });

        factory.build({
          state: 'processing',
          user: githubUser,
          site,
          commitSha,
        }).then((build) => {
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: commitSha,
            accessToken: 'fallback-access-token',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(statusNock.isDone()).to.be.true;
          done();
        }).catch(done);
      });
    });
  });
});
