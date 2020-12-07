const crypto = require('crypto');
const { expect } = require('chai');
const { spy } = require('sinon');
const nock = require('nock');
const config = require('../../../../config');
const { logger } = require('../../../../winston');
const factory = require('../../support/factory');
const githubAPINocks = require('../../support/githubAPINocks');
const { buildViewLink } = require('../../../../api/utils/build');

const GithubBuildStatusReporter = require('../../../../api/services/GithubBuildStatusReporter');

const requestedCommitSha = 'a172b66c31e19d456a448041a5b3c2a70c32d8b7';
const clonedCommitSha = '7b8d23c07a2c3b5a140844a654d91e13c66b271a';

describe('GithubBuildStatusReporter', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('reportBuildStatus(build)', () => {
    context('with a build in the processing state', () => {
      it("should report that the status is 'pending'", (done) => {
        let statusNock;
        let repoNock;
        let build;

        factory.build({
          state: 'processing',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          requestedCommitSha,
        }).then((_build) => {
          build = _build;
          return build.getUser();
        }).then((user) => {
          repoNock = githubAPINocks.repo({
            accessToken: user.githubAccessToken,
            owner: 'test-owner',
            repo: 'test-repo',
            username: user.username,
          });
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            repository: 'test-repo',
            sha: requestedCommitSha,
            state: 'pending',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(repoNock.isDone()).to.be.true;
          expect(statusNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
      });

      it("should report that the status if the build user does not have permission'", (done) => {
        let statusNock;
        const repoNocks = [];
        let build;
        let site;

        factory.site({ owner: 'test-owner', repository: 'test-repo' })
        .then((_site) => {
          site = _site;
          return factory.build({
            state: 'processing',
            site,
            requestedCommitSha,
          });
        }).then((_build) => {
          build = _build;
          return site.getUsers();
        }).then((users) => {
          let i;
          let options;
          for (i = 0; i < users.length; i += 1) {
            options = {
              accessToken: users[i].githubAccessToken,
              owner: 'test-owner',
              repo: 'test-repo',
              username: users[i].username,
            };
            if (users[i].id === build.user) { options.response = [201, { permissions: {} }]; }
            repoNocks.push(githubAPINocks.repo(options));
          }

          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            repository: 'test-repo',
            sha: requestedCommitSha,
            state: 'pending',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        })
        .then(() => {
          repoNocks.forEach(repoNock => expect(repoNock.isDone()).to.be.true);
          expect(statusNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
      });

      it("should report that the status if the build user does not have token'", (done) => {
        let statusNock;
        const repoNocks = [];
        let build;
        let site;

        factory.site({ owner: 'test-owner', repository: 'test-repo' })
        .then((_site) => {
          site = _site;
          return factory.build({
            state: 'processing',
            site,
            requestedCommitSha,
            user: factory.user({ site, githubAccessToken: null }),
          });
        }).then((_build) => {
          build = _build;
          return site.getUsers();
        }).then((users) => {
          let i;
          let options;
          for (i = 0; i < users.length; i += 1) {
            options = {
              accessToken: users[i].githubAccessToken,
              owner: 'test-owner',
              repo: 'test-repo',
              username: users[i].username,
            };
            if (users[i].id === build.user) {
              options.response = [403, { permissions: {} }];
            }
            repoNocks.push(githubAPINocks.repo(options));
          }

          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            repository: 'test-repo',
            sha: requestedCommitSha,
            state: 'pending',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        })
        .then(() => {
          repoNocks.forEach(repoNock => expect(repoNock.isDone()).to.be.true);
          expect(statusNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
      });

      it("should not report that the status if the build user does not have token'", (done) => {
        let statusNock;
        const repoNocks = [];
        let build;
        let site;
        const loggerSpy = spy(logger, 'error');

        factory.site({ owner: 'test-owner', repository: 'test-repo' })
        .then((_site) => {
          site = _site;
          return factory.build({
            state: 'processing',
            site,
            requestedCommitSha,
          });
        }).then((_build) => {
          build = _build;
          return site.getUsers();
        }).then((users) => {
          let i;
          let options;
          for (i = 0; i < users.length; i += 1) {
            options = {
              owner: 'test-owner',
              repo: 'test-repo',
              username: users[i].username,
              response: [403, { permissions: {} }],
            };
            repoNocks.push(githubAPINocks.repo(options));
          }
          return Promise.all(repoNocks);
        })
        .then(() => githubAPINocks.status({
          owner: 'test-owner',
          repo: 'test-repo',
          repository: 'test-repo',
          sha: requestedCommitSha,
          state: 'pending',
        }))
        .then((_statusNock) => {
          statusNock = _statusNock;
          return GithubBuildStatusReporter.reportBuildStatus(build);
        })
        .then(() => {
          expect(statusNock.isDone()).to.be.false;
          expect(loggerSpy.called).to.be.true;
          loggerSpy.restore();
          done();
        })
        .catch(done);
      });

      it('should set the target uri to the build logs', (done) => {
        let statusNock;
        let repoNock;
        let build;

        factory.build({
          state: 'processing',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          requestedCommitSha,
        }).then((_build) => {
          build = _build;
          return build.getUser();
        }).then((user) => {
          repoNock = githubAPINocks.repo({
            accessToken: 'fake-access-token',
            owner: 'test-owner',
            repo: 'test-repo',
            username: user.username,
          });
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: requestedCommitSha,
            targetURL: `${config.app.hostname}/sites/${build.site}/builds/${build.id}/logs`,
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(repoNock.isDone()).to.be.true;
          expect(statusNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
      });
    });

    context('with a build in the created state', () => {
      it("should report that the status is 'pending'", (done) => {
        let statusNock;
        let repoNock;
        let build;

        factory.build({
          state: 'created',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          requestedCommitSha,
        }).then((_build) => {
          build = _build;
          return build.getUser();
        }).then((user) => {
          repoNock = githubAPINocks.repo({
            accessToken: user.githubAccessToken,
            owner: 'test-owner',
            repo: 'test-repo',
            username: user.username,
          });
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            repository: 'test-repo',
            sha: requestedCommitSha,
            state: 'pending',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(repoNock.isDone()).to.be.true;
          expect(statusNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
      });

      it('should set the target uri to the build logs', (done) => {
        let statusNock;
        let repoNock;
        let build;

        factory.build({
          state: 'created',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          requestedCommitSha,
        }).then((_build) => {
          build = _build;
          return build.getUser();
        }).then((user) => {
          repoNock = githubAPINocks.repo({
            accessToken: 'fake-access-token',
            owner: 'test-owner',
            repo: 'test-repo',
            username: user.username,
          });
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: requestedCommitSha,
            targetURL: `${config.app.hostname}/sites/${build.site}/builds/${build.id}/logs`,
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(repoNock.isDone()).to.be.true;
          expect(statusNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
      });
    });

    context('with a build in the queued state', () => {
      it("should report that the status is 'pending'", (done) => {
        let statusNock;
        let repoNock;
        let build;

        factory.build({
          state: 'queued',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          requestedCommitSha,
        }).then((_build) => {
          build = _build;
          return build.getUser();
        }).then((user) => {
          repoNock = githubAPINocks.repo({
            accessToken: user.githubAccessToken,
            owner: 'test-owner',
            repo: 'test-repo',
            username: user.username,
          });
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            repository: 'test-repo',
            sha: requestedCommitSha,
            state: 'pending',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(repoNock.isDone()).to.be.true;
          expect(statusNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
      });

      it('should set the target uri to the build logs', (done) => {
        let statusNock;
        let repoNock;
        let build;

        factory.build({
          state: 'queued',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          requestedCommitSha,
        }).then((_build) => {
          build = _build;
          return build.getUser();
        }).then((user) => {
          repoNock = githubAPINocks.repo({
            accessToken: 'fake-access-token',
            owner: 'test-owner',
            repo: 'test-repo',
            username: user.username,
          });
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: requestedCommitSha,
            targetURL: `${config.app.hostname}/sites/${build.site}/builds/${build.id}/logs`,
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(repoNock.isDone()).to.be.true;
          expect(statusNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
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
        let repoNock;
        let build;

        factory.build({
          state: 'success',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          requestedCommitSha,
          clonedCommitSha
        }).then((_build) => {
          build = _build;
          return build.getUser();
        }).then((user) => {
          config.app.app_env = 'production';
          repoNock = githubAPINocks.repo({
            accessToken: 'fake-access-token',
            owner: 'test-owner',
            repo: 'test-repo',
            username: user.username,
          });
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: clonedCommitSha,
            state: 'success',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(repoNock.isDone()).to.be.true;
          expect(statusNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
      });
    });

    context('with a build in the success state', () => {
      it("should report that the status is 'success'", (done) => {
        let statusNock;
        let repoNock;
        let build;

        factory.build({
          state: 'success',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          requestedCommitSha,
          clonedCommitSha,
        }).then((_build) => {
          build = _build;
          return build.getUser();
        }).then((user) => {
          repoNock = githubAPINocks.repo({
            accessToken: 'fake-access-token',
            owner: 'test-owner',
            repo: 'test-repo',
            username: user.username,
          });
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: clonedCommitSha,
            state: 'success',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(repoNock.isDone()).to.be.true;
          expect(statusNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
      });

      it('should set the target uri to the preview link', (done) => {
        let statusNock;
        let repoNock;
        let build;

        factory.build({
          state: 'success',
          site: factory.site({
            owner: 'test-owner',
            repository: 'test-repo',
            awsBucketName: 'test-bucket',
          }),
          requestedCommitSha,
          clonedCommitSha,
          branch: 'preview-branch',
        }).then((_build) => {
          build = _build;
          return Promise.all([build.getUser(), build.getSite()]);
        }).then(([user, site]) => {
          repoNock = githubAPINocks.repo({
            accessToken: 'fake-access-token',
            owner: 'test-owner',
            repo: 'test-repo',
            username: user.username,
          });
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: clonedCommitSha,
            targetURL: buildViewLink(build, site),
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(repoNock.isDone()).to.be.true;
          expect(statusNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
      });
    });

    context('with a build in the error state', () => {
      it("should report that the status is 'error' with requestedCommitSha", (done) => {
        let statusNock;
        let repoNock;
        let build;

        factory.build({
          state: 'error',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          requestedCommitSha,
        }).then((_build) => {
          build = _build;
          return build.getUser();
        }).then((user) => {
          repoNock = githubAPINocks.repo({
            accessToken: 'fake-access-token',
            owner: 'test-owner',
            repo: 'test-repo',
            username: user.username,
          });
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: requestedCommitSha,
            state: 'error',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(statusNock.isDone()).to.be.true;
          expect(repoNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
      });

      it("should report that the status is 'error' with clonedCommitSha", (done) => {
        let statusNock;
        let repoNock;
        let build;

        factory.build({
          state: 'error',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          requestedCommitSha,
          clonedCommitSha,
        }).then((_build) => {
          build = _build;
          return build.getUser();
        }).then((user) => {
          repoNock = githubAPINocks.repo({
            accessToken: 'fake-access-token',
            owner: 'test-owner',
            repo: 'test-repo',
            username: user.username,
          });
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: clonedCommitSha,
            state: 'error',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(statusNock.isDone()).to.be.true;
          expect(repoNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
      });

      it('should set the target uri to the build logs', (done) => {
        let statusNock;
        let repoNock;
        let build;

        factory.build({
          state: 'error',
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          requestedCommitSha,
        }).then((_build) => {
          build = _build;
          return build.getUser();
        }).then((user) => {
          repoNock = githubAPINocks.repo({
            accessToken: 'fake-access-token',
            owner: 'test-owner',
            repo: 'test-repo',
            username: user.username,
          });
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: requestedCommitSha,
            targetURL: `${config.app.hostname}/sites/${build.site}/builds/${build.id}/logs`,
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(statusNock.isDone()).to.be.true;
          expect(repoNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
      });
    });

    context('with a build by a Federalist user', () => {
      it("should use the GitHub access token of the build's user", (done) => {
        let statusNock;
        let repoNock;
        let build;

        factory.build({
          state: 'error',
          user: factory.user({ githubAccessToken: 'federalist-user-access-token' }),
          site: factory.site({ owner: 'test-owner', repository: 'test-repo' }),
          requestedCommitSha,
        }).then((_build) => {
          build = _build;
          return build.getUser();
        }).then((user) => {
          repoNock = githubAPINocks.repo({
            accessToken: 'federalist-user-access-token',
            owner: 'test-owner',
            repo: 'test-repo',
            username: user.username,
          });
          statusNock = githubAPINocks.status({
            owner: 'test-owner',
            repo: 'test-repo',
            sha: requestedCommitSha,
            accessToken: 'federalist-user-access-token',
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        }).then(() => {
          expect(statusNock.isDone()).to.be.true;
          expect(repoNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
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

      let invalidPermissionsNock;

      it('uses the access token of a signed in user with valid permissions', (done) => {
        let site;
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
            requestedCommitSha,
          })
        )
        .then((build) => {
          statusNock = githubAPINocks.status({
            owner: site.owner,
            repo: site.repository,
            sha: requestedCommitSha,
            accessToken: federalistUser.githubAccessToken,
          });
          invalidPermissionsNock = githubAPINocks.repo({
            response: [201, {
              permissions: { admin: false },
            }],
          });
          validPermissionsNock = githubAPINocks.repo({
            response: [201, {
              permissions: { admin: true, push: true },
            }],
          });

          return GithubBuildStatusReporter.reportBuildStatus(build);
        })
        .then(() => {
          expect(statusNock.isDone()).to.be.true;
          expect(invalidPermissionsNock.isDone()).to.be.true;
          expect(validPermissionsNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
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
            requestedCommitSha,
          })
        )
        .then((build) => {
          githubAPINocks.repo({
            response: [201, {
              permissions: { admin: false },
            }],
          });
          githubAPINocks.status({
            owner: build.site.owner,
            repo: build.site.repository,
            sha: requestedCommitSha,
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
