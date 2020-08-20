const expect = require('chai').expect;
const nock = require('nock');
const request = require('supertest');
const { stub } = require('sinon');
const app = require('../../../app');
const SQS = require('../../../api/services/SQS');
const factory = require('../support/factory');
const githubAPINocks = require('../support/githubAPINocks');
const { authenticatedSession, unauthenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const { Build } = require('../../../api/models');
const csrfToken = require('../support/csrfToken');

const commitSha = 'a172b66c31e19d456a448041a5b3c2a70c32d8b7';

describe('Build API', () => {
  let sendMessageStub;

  beforeEach(() => {
    sendMessageStub = stub(SQS, 'sendBuildMessage').returns(Promise.resolve());
  });

  afterEach(() => {
    sendMessageStub.restore();
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
    expect(build.commitSha == response.commitSha).to.be.ok;
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

    it('should require authentication', (done) => {
      Promise.props({
        cookie: unauthenticatedSession(),
      })
      .then(cookie =>
        request(app)
          .post('/v0/build/')
          .set('x-csrf-token', csrfToken.getToken())
          .send({
            buildId: 1,
          })
          .set('Cookie', cookie)
          .expect(403)
      )
      .then((response) => {
        validateAgainstJSONSchema('POST', '/build', 403, response.body);
        done();
      })
      .catch(done);
    });

    it('should require a valid csrf token', (done) => {
      const userPromise = factory.user();
      const sitePromise = factory.site({ users: Promise.all([userPromise]) });

      Promise.props({
        user: userPromise,
        site: sitePromise,
        cookie: authenticatedSession(userPromise),
      })
      .then(promises =>
        request(app)
          .post('/v0/build/')
          .set('x-csrf-token', 'bad-token')
          .send({
            buildId: 1,
          })
          .set('Cookie', promises.cookie)
          .expect(403)
      )
      .then((response) => {
        validateAgainstJSONSchema('POST', '/build', 403, response.body);
        expect(response.body.message).to.equal('Invalid CSRF token');
        done();
      })
      .catch(done);
    });

    it('returns a 404 if a build to restart is not associated with the site', (done) => {
      const userPromise = factory.user();
      const sitePromise = factory.site({ users: Promise.all([userPromise]) });

      Promise.props({
        user: userPromise,
        site: sitePromise,
        cookie: authenticatedSession(userPromise),
      }).then(promises =>
        request(app)
          .post('/v0/build/')
          .set('x-csrf-token', csrfToken.getToken())
          .send({
            buildId: 1,
            siteId: promises.site.id,
          })
          .set('Cookie', promises.cookie)
          .expect(404)
      )
      .then((response) => {
        validateAgainstJSONSchema('POST', '/build', 404, response.body);
        done();
      })
      .catch(done);
    });

    describe('successful requests', () => {
      describe('with an existing build', () => {
        let promiseProps;

        beforeEach( async () => {
          const userPromise = factory.user();
          const sitePromise = await factory.site({ users: Promise.all([userPromise]) });
          await Build.update(
            { state: 'success'}, //values
            { where: //options
              { site: sitePromise.id,
                branch: 'main',
                state: 'queued',
              },
            }
          );
          promiseProps = Promise.props({
            user: userPromise,
            site: sitePromise,
            build: factory.build({
              site: sitePromise,
              state: 'success',
              branch: 'main',
              commitSha,
              user: userPromise,
            }),
            cookie: authenticatedSession(userPromise),
          });
        });

        it('should create a new build for the site given an existing build id', (done) => {
          let site;
          let user;

          promiseProps
          .then((promisedValues) => {
            site = promisedValues.site;
            user = promisedValues.user;

            return validCreateRequest(
              csrfToken.getToken(),
              promisedValues.cookie,
              {
                buildId: promisedValues.build.id,
                siteId: site.id,
              }
            );
          })
          .then((response) => {
            validateAgainstJSONSchema('POST', '/build', 200, response.body);
            return Build.findOne({
              where: {
                site: site.id,
                user: user.id,
                branch: 'my-branch',
                commitSha,
              },
            });
          })
          .then((build) => {
            expect(build).not.to.be.undefined;
            done();
          })
          .catch(done);
        });

        it('creates a new build from a branch name given an existing build of that branch', (done) => {
          let site;
          let user;

          promiseProps
          .then((promisedValues) => {
            site = promisedValues.site;
            user = promisedValues.user;

            return validCreateRequest(
              csrfToken.getToken(),
              promisedValues.cookie,
              {
                branch: promisedValues.build.branch,
                siteId: promisedValues.build.site,
                sha: promisedValues.build.commitSha,
              }
            );
          })
          .then((response) => {
            validateAgainstJSONSchema('POST', '/build', 200, response.body);
            return Build.findOne({
              where: {
                site: site.id,
                user: user.id,
                branch: 'my-branch',
                commitSha,
              },
            });
          })
          .then((build) => {
            expect(build).not.to.be.undefined;
            done();
          })
          .catch(done);
        });

        it('should NOT create a new build if a branch build already exists in queued', (done) => {
          let site;
          let user;
          let build;
          let cookie;

          promiseProps
          .then((promisedValues) => {
            site = promisedValues.site;
            user = promisedValues.user;
            build = promisedValues.build;
            cookie = promisedValues.cookie;
            return build.update({ state: 'queued'})
          })
          .then(() => {
            return validCreateRequest(
              csrfToken.getToken(),
              cookie,
              {
                buildId: build.id,
                siteId: site.id,
              }
            );
          })
          .then((response) => {
            expect(response.body).deep.equal({});
            return Build.findOne({
              where: {
                site: site.id,
                branch: 'my-branch',
                state: 'queued',
              },
            });
          })
          .then((build) => {
            expect(build).to.be.null;
            done();
          })
          .catch(done);
        });

        it('should report the new build\'s status to GitHub', (done) => {
          nock.cleanAll();
          const statusNock = githubAPINocks.status({ state: 'pending' });

          promiseProps
          .then((promisedValues) => {
            githubAPINocks.repo({
              accessToken: promisedValues.user.githubAccessToken,
              owner: promisedValues.site.owner,
              repo: promisedValues.site.repository,
              username: promisedValues.user.username,
            });
            return validCreateRequest(
              csrfToken.getToken(),
              promisedValues.cookie,
              {
                buildId: promisedValues.build.id,
                siteId: promisedValues.build.site,
              }
            );
          })
          .then(() => {
            expect(statusNock.isDone()).to.be.true;
            done();
          })
          .catch(done);
        });
      });

      it('creates a new build from a branch if that branch exists on GitHub', (done) => {
        const branch = 'main';
        let site;
        let user;
        let mockGHRequest;

        const userPromise = factory.user();

        Promise.props({
          user: userPromise,
          site: factory.site({ users: Promise.all([userPromise]) }),
          cookie: authenticatedSession(userPromise),
        })
        .then((promisedValues) => {
          site = promisedValues.site;
          user = promisedValues.user;

          mockGHRequest = githubAPINocks.getBranch({
            owner: site.owner,
            repo: site.repository,
            branch,
            expected: {
              name: branch,
              commit: { sha: commitSha },
            },
          });

          return validCreateRequest(
            csrfToken.getToken(),
            promisedValues.cookie,
            {
              branch,
              siteId: site.id,
              sha: commitSha,
            }
          );
        })
        .then((response) => {
          validateAgainstJSONSchema('POST', '/build', 200, response.body);
          return Build.findOne({
            where: {
              site: site.id,
              user: user.id,
              branch,
              commitSha,
            },
          });
        })
        .then((build) => {
          expect(build).to.not.be.undefined;
          expect(build.branch).to.equal(branch);
          expect(mockGHRequest.isDone()).to.equal(true);
          done();
        })
        .catch(done);
      });
    });

    it('should render a 403 if the user is not associated with the given site', (done) => {
      const userProm = factory.user();
      const notAuthorizedSiteProm = factory.site();
      const buildPromise = factory.build({ site: notAuthorizedSiteProm });
      const cookieProm = authenticatedSession(userProm);

      Promise.props({
        user: userProm,
        notAuthorizedSite: notAuthorizedSiteProm,
        build: buildPromise,
        cookie: cookieProm,
      })
      .then(({ build, cookie }) =>
        request(app)
          .post('/v0/build/')
          .set('x-csrf-token', csrfToken.getToken())
          .send({
            buildId: build.id,
            siteId: 1,
          })
          .set('Cookie', cookie)
          .expect(403)
      )
      .then((response) => {
        validateAgainstJSONSchema('POST', '/build', 403, response.body);
        done();
      })
      .catch(done);
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
        expect(response.body).to.have.length(2);

        builds.forEach((build) => {
          const responseBuild = response.body.find(candidate => candidate.id === build.id);
          expect(responseBuild).not.to.be.undefined;
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
          .bulkBuild({ site: props.site.id, user: props.user.id }, 110)
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
        });
    };

    beforeEach(() => {
      nock.cleanAll();
      githubAPINocks.status();
    });


    it('should report the build\'s status back to github', (done) => {
      nock.cleanAll();
      const statusNock = githubAPINocks.status({ state: 'success' });
      let build;

      factory.build({ commitSha })
      .then((_build) => {
        build = _build;
        return Promise.all([build.getUser(), build.getSite()]);
      }).then(([user, site]) => {
        githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
        });
        return postBuildStatus({
          build,
          status: 'success',
          message: '',
        });
      })
      .then(() => {
        expect(statusNock.isDone()).to.be.true;
        done();
      })
      .catch(done);
    });

    it('should respond with a 404 for an id that is NaN', (done) => {
      postBuildStatus({
        build: { id: 'invalid-build-id', token: 'invalid-token' },
        status: 'success',
        message: '',
      }).expect(404, done);
    });

    it('should respond with a 404 for a build that does not exist', (done) => {
      const build = factory.build({ commitSha });
      build.id = -1;
      postBuildStatus({
        build,
        status: 'success',
        message: '',
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
        }).expect(403)
      )
      .then(() => Build.findByPk(build.id))
      .then((unmodifiedBuild) => {
        expect(unmodifiedBuild).to.not.be.undefined;
        expect(unmodifiedBuild.state).to.equal('queued');
        done();
      })
      .catch(done);
    });
  });
});
