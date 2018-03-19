const crypto = require('crypto');
const { expect } = require('chai');
const { spy } = require('sinon');
const logger = require('winston');
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
      const githubUserName = () => `github-user-${crypto.randomBytes(8).toString('hex')}`;
      const validUserParams = () => ({
        username: githubUserName(),
        githubAccessToken: 'fallback-access-token',
        signedInAt: new Date(),
      });
      const invalidUserParams = () => ({
        username: githubUserName(),
        githubAccessToken: null,
      });

      let site;
      let invalidPermissionsNock;

      it('uses the access token of a signed in user with valid permissions' , (done) => {
        let statusNock;
        let validPermissionsNock;

        const federalistUser = factory.user(validUserParams());
        const expiredFederalistUser = factory.user({
          signedInAt: new Date(),
        });
        const githubUser = factory.user(invalidUserParams());

        factory.site({
          owner: 'test-owner',
          repository: 'test-repo',
          users: Promise.all([expiredFederalistUser, federalistUser, githubUser]),
        })
        .then((model) => {
          site = model;
        })
        .then(() =>
          factory.build({
            state: 'processing',
            user: githubUser,
            site,
            commitSha,
          })
        )
        .then((build) => {
          statusNock = githubAPINocks.status({
            owner: site.owner,
            repo: site.repository,
            sha: commitSha,
            accessToken: federalistUser.githubAccessToken,
          });
          invalidPermissionsNock = githubAPINocks.repo({
            response: [201, {
              permissions: { admin: false },
            }],
          });
          validPermissionsNock = githubAPINocks.repo({
            response: [201, {
              permissions: { admin: true },
            }],
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(statusNock.isDone()).to.be.true;
          expect(invalidPermissionsNock.isDone()).to.be.true;
          expect(validPermissionsNock.isDone()).to.be.true;
          done();
        }).catch(done);
      });

      it('reports an error if no users with valid permissions are found', (done) => {
        const githubUser = factory.user(invalidUserParams());
        const loggerSpy = spy(logger, 'error');

        factory.site({
          owner: 'test-owner',
          repository: 'test-repo',
          users: Promise.all([githubUser]),
        })
        .then(site =>
          factory.build({
            state: 'processing',
            user: githubUser,
            site,
            commitSha,
          })
        )
        .then(build => {
          invalidPermissionsNock = githubAPINocks.repo({
            response: [201, {
              permissions: { admin: false },
            }],
          });
          statusNock = githubAPINocks.status({
            owner: site.owner,
            repo: site.repository,
            sha: commitSha,
            accessToken: githubUser.githubAccessToken,
          });
          
          return GithubBuildStatusReporter.reportBuildStatus(build);
        })
        .then(() => {
          expect(loggerSpy.called).to.be.true;
          loggerSpy.restore();
          done();
        })
        .catch(done);
      });
    });
  });
});
