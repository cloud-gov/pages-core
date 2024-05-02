const { expect } = require('chai');
const nock = require('nock');
const request = require('supertest');
const sinon = require('sinon');
const app = require('../../../app');
const queueJobs = require('../../../api/queue-jobs');
const GithubBuildHelper = require('../../../api/services/GithubBuildHelper');
const EventCreator = require('../../../api/services/EventCreator');
const factory = require('../support/factory');
const githubAPINocks = require('../support/githubAPINocks');
const { authenticatedSession, unauthenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const { Build } = require('../../../api/models');
const csrfToken = require('../support/csrfToken');

const requestedCommitSha = 'a172b66c31e19d456a448041a5b3c2a70c32d8b7';
const clonedCommitSha = '7b8d23c07a2c3b5a140844a654d91e13c66b271a';

describe('Build API', () => {
  beforeEach(() => {
    sinon.stub(queueJobs, 'startSiteBuild').resolves();
    sinon.stub(EventCreator, 'audit').resolves();
    sinon.stub(EventCreator, 'error').resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  const buildResponseExpectations = (response, build) => {
    if (build.completedAt) {
      expect(build.completedAt.toISOString()).to.equal(response.completedAt);
    } else {
      expect(response.completedAt).to.be.undefined;
    }
    /* eslint-disable eqeqeq */
    expect(build.error == response.error).to.be.ok;
    expect(build.branch == response.branch).to.be.ok;
    expect(build.requestedCommitSha == response.requestedCommitSha).to.be.ok;
    /* eslint-enable eqeqeq */
    expect(response.site.id).to.equal(build.site || build.Site.id);
    expect(response.user.id).to.equal(build.user || build.User.id);
    expect(response.buildLogs).to.be.undefined;
  };

  describe('POST /v0/build', () => {
    const validCreateRequest = (token, cookie, params) =>
      request(app)
        .post('/v0/build/')
        .set('x-csrf-token', token)
        .send(params)
        .set('Cookie', cookie)
        .expect(200);

    beforeEach(() => {
      nock.cleanAll();
      githubAPINocks.status();
    });
    describe('unsuccessful requests', () => {
      it('should require authentication', async () => {
        const cookie = await unauthenticatedSession();
        const response = await request(app)
          .post('/v0/build/')
          .set('x-csrf-token', csrfToken.getToken())
          .send({
            buildId: 1,
          })
          .set('Cookie', cookie)
          .expect(403);
        validateAgainstJSONSchema('POST', '/build', 403, response.body);
      });

      it('should require a valid csrf token', async () => {
        const user = await factory.user();
        const cookie = await authenticatedSession(user);
        const response = await request(app)
          .post('/v0/build/')
          .set('x-csrf-token', 'bad-token')
          .send({
            buildId: 1,
          })
          .set('Cookie', cookie)
          .expect(403);

        validateAgainstJSONSchema('POST', '/build', 403, response.body);
        expect(response.body.message).to.equal('Invalid CSRF token');
      });

      it('returns a 404 if a build to restart is not associated with the site', async () => {
        const user = await factory.user();
        const site = await factory.site({ users: [user] });
        const build = await factory.build({ user });
        const cookie = await authenticatedSession(user);
        const response = request(app)
          .post('/v0/build/')
          .set('x-csrf-token', csrfToken.getToken())
          .send({
            buildId: build.id,
            siteId: site.id,
          })
          .set('Cookie', cookie)
          .expect(404);
        validateAgainstJSONSchema('POST', '/build', 404, response.body);
      });

      it('should render a 403 if the user is not associated with the given site', async () => {
        const user = await factory.user();
        const site = await factory.site();
        const build = await factory.build({ site });
        const cookie = await authenticatedSession(user);

        const response = request(app)
          .post('/v0/build/')
          .set('x-csrf-token', csrfToken.getToken())
          .send({
            buildId: build.id,
            siteId: site.id,
          })
          .set('Cookie', cookie)
          .expect(403);

        validateAgainstJSONSchema('POST', '/build', 403, response.body);
      });
    });

    describe('successful requests', () => {
      describe('with an existing build', () => {
        let user;
        let site;
        let reqBuild;
        let cookie;

        beforeEach(async () => {
          nock.cleanAll();
          user = await factory.user();
          site = await factory.site({ users: [user] });
          reqBuild = await factory.build({
            site,
            state: 'success',
            branch: 'main',
            requestedCommitSha,
            clonedCommitSha,
            user,
          });
          cookie = await authenticatedSession(user);
        });

        it('should create a new build for the site given an existing build id', async () => {
          const statusNock = githubAPINocks.status({
            owner: site.owner,
            repo: site.repository,
            repository: site.repository,
            sha: clonedCommitSha,
            state: 'pending',
          });
          const repoNock = githubAPINocks.repo({
            accessToken: user.githubAccessToken,
            owner: site.owner,
            repo: site.repository,
            username: user.username,
          });
          const response = await validCreateRequest(
            csrfToken.getToken(),
            cookie,
            {
              buildId: reqBuild.id,
              siteId: site.id,
            }
          );
          validateAgainstJSONSchema('POST', '/build', 200, response.body);
          const latestBuild = await Build.findOne({
            where: {
              site: site.id,
              branch: reqBuild.branch,
            },
            order: [['createdAt', 'DESC']],
          });
          expect(latestBuild.id).to.be.above(reqBuild.id);
          expect(latestBuild.requestedCommitSha).to.equal(reqBuild.clonedCommitSha);
          expect(repoNock.isDone()).to.be.true;
          expect(statusNock.isDone()).to.be.true;
        });

        it('should NOT create a new build if a branch build already exists @state=queued', async () => {
          await reqBuild.update({ state: 'queued' });
          const response = await validCreateRequest(
            csrfToken.getToken(),
            cookie,
            {
              buildId: reqBuild.id,
              siteId: site.id,
            }
          );
          expect(response.body).deep.equal({});
          const latestBuild = await Build.findOne({
            where: {
              site: site.id,
              branch: reqBuild.branch,
            },
            order: [['createdAt', 'DESC']],
          });
          expect(latestBuild.id).to.equal(reqBuild.id);
        });

        it('should NOT create a new build if a branch build already exists @state=created', async () => {
          await reqBuild.update({ state: 'created' });
          const response = await validCreateRequest(
            csrfToken.getToken(),
            cookie,
            {
              buildId: reqBuild.id,
              siteId: site.id,
            }
          );
          expect(response.body).deep.equal({});
          const latestBuild = await Build.findOne({
            where: {
              site: site.id,
              branch: reqBuild.branch,
            },
            order: [['createdAt', 'DESC']],
          });
          expect(latestBuild.id).to.equal(reqBuild.id);
        });
      });
    });
  });

  describe('GET /v0/site/:site_id/build', () => {
    it('should require authentication', (done) => {
      factory.site()
        .then(site =>
          request(app)
            .get(`/v0/site/${site.id}/build`)
            .expect(403)
        )
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/build', 403, response.body);
          done();
        })
        .catch(done);
    });

    it('should list builds for a site associated with the current user', (done) => {
      let site;
      let builds;

      const userPromise = factory.user();
      const sitePromise = factory.site({ users: Promise.all([userPromise]) });
      const buildsPromise = Promise.all([
        factory.build({ site: sitePromise }),
        factory.build({ site: sitePromise, user: userPromise }),
        factory.build({
          site: sitePromise,
          user: userPromise,
          state: 'error',
          error: 'The build timed out',
        }),
      ]);

      Promise.props({
        site: sitePromise,
        builds: buildsPromise,
        cookie: authenticatedSession(userPromise),
      })
        .then((promisedValues) => {
          ({ site, builds } = promisedValues);
          const cookie = promisedValues.cookie;

          return request(app)
            .get(`/v0/site/${site.id}/build`)
            .set('Cookie', cookie)
            .expect(200);
        })
        .then((response) => {
          expect(response.body).to.be.a('Array');
          expect(response.body).to.have.length(3);

          builds.forEach((build) => {
            const responseBuild = response.body.find(candidate => candidate.id === build.id);
            buildResponseExpectations(responseBuild, build);
          });

          validateAgainstJSONSchema('GET', '/site/{site_id}/build', 200, response.body);
          done();
        })
        .catch(done);
    });

    it('should not list builds for a site not associated with the current user', (done) => {
      let site;

      const userPromise = factory.user();
      const sitePromise = factory.site();
      const buildsPromise = Promise.all([
        factory.build({ site: sitePromise }),
        factory.build({ site: sitePromise, user: userPromise }),
      ]);

      Promise.props({
        user: userPromise,
        site: sitePromise,
        builds: buildsPromise,
        cookie: authenticatedSession(userPromise),
      })
        .then((promisedValues) => {
          site = promisedValues.site;
          const cookie = promisedValues.cookie;

          return request(app)
            .get(`/v0/site/${site.id}/build`)
            .set('Cookie', cookie)
            .expect(403);
        })
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/build', 403, response.body);
          done();
        })
        .catch(done);
    });

    it('shouldn\'t list more than 100 builds', (done) => {
      const userPromise = factory.user();
      const sitePromise = factory.site({ users: Promise.all([userPromise]) });
      const cookiePromise = authenticatedSession(userPromise);

      Promise.props({
        site: sitePromise,
        cookie: cookiePromise,
        user: userPromise,
      })
        .then(props => factory
          .bulkBuild({ site: props.site.id, user: props.user.id, username: props.user.username }, 110)
          .then(() => props))
        .then(({ site, cookie }) => request(app)
          .get(`/v0/site/${site.id}/build`)
          .set('Cookie', cookie)
          .expect(200))
        .then((response) => {
          expect(response.body).to.be.an('array');
          expect(response.body).to.have.length(100);
          done();
        })
        .catch(done);
    });

    it('should not display unfound build', (done) => {
      const userPromise = factory.user();
      const sitePromise = factory.site();
      const buildsPromise = Promise.all([
        factory.build({ site: sitePromise, user: userPromise }),
      ]);

      Promise.props({
        user: userPromise,
        site: sitePromise,
        builds: buildsPromise,
        cookie: authenticatedSession(userPromise),
      })
        .then((promisedValues) => {
          const cookie = promisedValues.cookie;
          return request(app)
            .get('/v0/site/-1000/build')
            .set('Cookie', cookie)
            .expect(404);
        })
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/build', 404, response.body);
          done();
        })
        .catch(done);
    });

    it('should not display build when site id is NaN', (done) => {
      const userPromise = factory.user();
      Promise.props({
        user: userPromise,
        cookie: authenticatedSession(userPromise),
      })
        .then(promisedValues => request(app)
          .get('/v0/site/NaN/build')
          .set('Cookie', promisedValues.cookie)
          .expect(404)
        ).then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/build', 404, response.body);
          done();
        })
        .catch(done);
    });
  });


  describe('GET /v0/build/:id', () => {
    it('should require authentication', (done) => {
      factory.build()
        .then(build =>
          request(app)
            .get(`/v0/build/${build.id}`)
            .expect(403)
        )
        .then((response) => {
          validateAgainstJSONSchema('GET', '/build/{id}', 403, response.body);
          done();
        })
        .catch(done);
    });

    it('should return a single build matching the given build id', (done) => {
      let build;

      const userPromise = factory.user();
      const sitePromise = factory.site({ users: Promise.all([userPromise]) });
      const buildPromise = factory.build({
        site: sitePromise,
        user: userPromise,
        state: 'error',
        error: 'The build timed out'
      });

      Promise.props({
        site: sitePromise,
        build: buildPromise,
        cookie: authenticatedSession(userPromise),
      })
        .then((promisedValues) => {
          ({ site, build } = promisedValues);
          const cookie = promisedValues.cookie;

          return request(app)
            .get(`/v0/build/${build.id}`)
            .set('Cookie', cookie)
            .expect(200);
        })
        .then((response) => {
          const responseBuild = response.body;
          expect(responseBuild).to.be.a('Object');
          buildResponseExpectations(responseBuild, build);
          validateAgainstJSONSchema('GET', '/build/{id}', 200, responseBuild);
          done();
        })
        .catch(done);
    });

    it('should not return the matching build if it is not associated with the current user', (done) => {
      let build;

      const userPromise = factory.user();
      const sitePromise = factory.site();
      const buildPromise = factory.build({ site: sitePromise, user: userPromise });


      Promise.props({
        user: userPromise,
        site: sitePromise,
        build: buildPromise,
        cookie: authenticatedSession(userPromise),
      })
        .then((promisedValues) => {
          build = promisedValues.build;
          const cookie = promisedValues.cookie;

          return request(app)
            .get(`/v0/build/$build.id}`)
            .set('Cookie', cookie)
            .expect(404);
        })
        .then((response) => {
          validateAgainstJSONSchema('GET', '/build/{id}', 403, response.body);
          done();
        })
        .catch(done);
    });

    it('should not display unfound build', (done) => {

      const userPromise = factory.user();
      const sitePromise = factory.site();
      const buildPromise = factory.build({ site: sitePromise, user: userPromise });

      Promise.props({
        user: userPromise,
        site: sitePromise,
        build: buildPromise,
        cookie: authenticatedSession(userPromise),
      })
        .then((promisedValues) => {
          const cookie = promisedValues.cookie;
          return request(app)
            .get('/v0/build/-1000')
            .set('Cookie', cookie)
            .expect(404);
        })
        .then((response) => {
          validateAgainstJSONSchema('GET', '/build/{id}', 404, response.body);
          done();
        })
        .catch(done);
    });

    it('should not display build when build id is NaN', (done) => {
      const userPromise = factory.user();
      Promise.props({
        user: userPromise,
        cookie: authenticatedSession(userPromise),
      })
        .then(promisedValues => request(app)
          .get('/v0/build/NaN')
          .set('Cookie', promisedValues.cookie)
          .expect(404)
        ).then((response) => {
          validateAgainstJSONSchema('GET', '/build/{id}', 404, response.body);
          done();
        })
        .catch(done);
    });
  });

  describe('POST /v0/build/:id/status/:token', () => {
    const encode64 = str => Buffer.from(str, 'utf8').toString('base64');

    const postBuildStatus = (options) => {
      const buildToken = options.buildToken || options.build.token;

      return request(app)
        .post(`/v0/build/${options.build.id}/status/${buildToken}`)
        .type('json')
        .send({
          status: options.status,
          message: encode64(options.message),
          commitSha: options.commitSha,
        });
    };

    beforeEach(() => {
      nock.cleanAll();
    });


    it('should report the build\'s status back to github', async () => {
      const statusNock = githubAPINocks.status({ status: 'pending', commitSha: clonedCommitSha });
      const fetchContentStub = sinon.stub(GithubBuildHelper, 'fetchContent').resolves('{}');
      const build = await factory.build({ requestedCommitSha });
      const user = await build.getUser();
      const site = await build.getSite();

      githubAPINocks.repo({
        accessToken: user.githubAccessToken,
        owner: site.owner,
        repo: site.repository,
        username: user.username,
      });
      await postBuildStatus({
        build,
        status: Build.States.Processing,
        message: '',
        commitSha: requestedCommitSha,
      });

      await build.reload();
      expect(build.state).to.equal(Build.States.Processing);
      expect(statusNock.isDone()).to.be.true;
      expect(fetchContentStub.notCalled).to.be.true;
    });

    it('should report the build\'s success status back to github', async () => {
      const statusNock = githubAPINocks.status({ state: 'success', commitSha: clonedCommitSha });
      const build = await factory.build({ requestedCommitSha, clonedCommitSha });
      const user = await build.getUser();
      const site = await build.getSite();

      githubAPINocks.repo({
        accessToken: user.githubAccessToken,
        owner: site.owner,
        repo: site.repository,
        username: user.username,
      });
      await postBuildStatus({
        build,
        status: Build.States.Success,
        message: '',
        commitSha: clonedCommitSha,
      });

      await build.reload();
      expect(build.state).to.equal(Build.States.Success);
      expect(statusNock.isDone()).to.be.true;
    });

    it('should report the build\'s success status back to github w/o build settings file', async () => {
      const statusNock = githubAPINocks.status({ state: 'success', commitSha: clonedCommitSha });
      const build = await factory.build({ requestedCommitSha, clonedCommitSha });
      const user = await build.getUser();
      const site = await build.getSite();

      githubAPINocks.repo({
        accessToken: user.githubAccessToken,
        owner: site.owner,
        repo: site.repository,
        username: user.username,
      });
      await postBuildStatus({
        build,
        status: Build.States.Success,
        message: '',
        commitSha: clonedCommitSha,
      });

      await build.reload();
      expect(build.state).to.equal(Build.States.Success);
      expect(statusNock.isDone()).to.be.true;
    });

    it('should respond with a 404 for an id that is NaN', (done) => {
      postBuildStatus({
        build: { id: 'invalid-build-id', token: 'invalid-token' },
        status: 'success',
        message: '',
        commitSha: clonedCommitSha,
      }).expect(404, done);
    });

    it('should respond with a 404 for a build that does not exist', (done) => {
      const build = { id: -1, token: 'good-token' };
      postBuildStatus({
        build,
        status: 'success',
        message: '',
        commitSha: clonedCommitSha,
      }).expect(404, done);
    });

    it('should respond with a 403 and not modify the build for an invalid build token', (done) => {
      let build;

      factory.build()
        .then((model) => {
          build = model;
        })
        .then(() =>
          postBuildStatus({
            build,
            buildToken: 'invalid-token',
            status: 'success',
            message: '',
            commitSha: clonedCommitSha,
          }).expect(403)
        )
        .then(() => Build.findByPk(build.id))
        .then((unmodifiedBuild) => {
          expect(unmodifiedBuild.state).to.equal('created');
          expect(unmodifiedBuild.clonedCommitSha).to.be.null;
          done();
        })
        .catch(done);
    });
  });

  describe('POST /v0/build/:id/metrics/:token', () => {
    const postBuildMetrics = (options) => {
      const buildToken = options.buildToken || options.build.token;

      return request(app)
        .post(`/v0/build/${options.build.id}/metrics/${buildToken}`)
        .type('json')
        .send(options.metrics);
    };

    beforeEach(() => {
      nock.cleanAll();
    });

    it('should respond with a 404 for an id that is NaN', (done) => {
      postBuildMetrics({
        build: { id: 'invalid-build-id', token: 'invalid-token' },
        metrics: { cpu: 100 },
      }).expect(404, done);
    });

    it('should respond with a 404 for a build that does not exist', (done) => {
      const build = { id: -1, token: 'good-token' };
      postBuildMetrics({
        build,
        metrics: { cpu: 100 },
      }).expect(404, done);
    });

    it('should respond with a 403 and not modify the build for an invalid build token', (done) => {
      let build;

      factory.build()
        .then((model) => {
          build = model;
        })
        .then(() => postBuildMetrics({
          build,
          buildToken: 'invalid-token',
          metrics: { cpu: 100 },
        }).expect(403))
        .then(() => Build.findByPk(build.id))
        .then((unmodifiedBuild) => {
          expect(unmodifiedBuild.metrics).to.be.null;
          done();
        })
        .catch(done);
    });

    it('should respond with a 200 and modify the build for a correct build token', (done) => {
      let build;

      factory.build()
        .then((model) => {
          build = model;
        })
        .then(() => postBuildMetrics({
          build,
          metrics: { cpu: 100 },
        }).expect(200))
        .then(() => Build.findByPk(build.id))
        .then((modifiedBuild) => {
          expect(modifiedBuild.metrics.cpu).to.equal(100);
          done();
        })
        .catch(done);
    });
  });
});
