const expect = require('chai').expect;
const nock = require('nock');
const request = require('supertest');

const app = require('../../../app');
const factory = require('../support/factory');
const githubAPINocks = require('../support/githubAPINocks');
const { authenticatedSession, unauthenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const { Build, User, Site } = require('../../../api/models');
const csrfToken = require('../support/csrfToken');

const commitSha = 'a172b66c31e19d456a448041a5b3c2a70c32d8b7';

describe('Build API', () => {
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

    it('returns a 403 if a build to restart is not associated with the user', (done) => {
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
          .expect(403)
      .then((response) => {
        validateAgainstJSONSchema('POST', '/build', 403, response.body);
        done();
      })
      ).catch(done);
    });

    describe('successful requests', () => {
      let userPromise;
      let sitePromise;
      let buildPromise;

      beforeEach(() => {
        userPromise = factory.user();
        sitePromise = factory.site({ users: Promise.all([userPromise]) });
        buildPromise = factory.build({
          site: sitePromise,
          branch: 'master',
          commitSha,
          user: userPromise,
        });
      });

      it('should create a new build for the site given an existing build id', (done) => {
        let site;
        let user;

        Promise.props({
          user: userPromise,
          site: sitePromise,
          build: buildPromise,
          cookie: authenticatedSession(userPromise),
        })
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

        Promise.props({
          user: userPromise,
          site: sitePromise,
          build: buildPromise,
          cookie: authenticatedSession(userPromise),
        })
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

      it('should report the new build\'s status to GitHub', (done) => {
        nock.cleanAll();
        const statusNock = githubAPINocks.status({ state: 'pending' });

        Promise.props({
          user: userPromise,
          site: sitePromise,
          build: buildPromise,
          cookie: authenticatedSession(userPromise),
        })
        .then(promisedValues =>
          validCreateRequest(
            csrfToken.getToken(),
            promisedValues.cookie,
            {
              buildId: promisedValues.build.id,
              siteId: promisedValues.build.site,
            }
          )
        )
        .then(() => {
          expect(statusNock.isDone()).to.be.true;
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

  describe('GET /v0/build/:id', () => {
    it('should require authentication', (done) => {
      factory.build().then(build =>
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

    it('should return a JSON representation of the build', (done) => {
      let build;
      const buildAttributes = {
        error: 'message',
        state: 'error',
        branch: '18f-pages',
        completedAt: new Date(),
        commitSha,
      };

      factory.build(buildAttributes).then((model) => {
        build = model;
        return authenticatedSession(
          User.findById(build.user)
        );
      })
      .then(cookie =>
        request(app)
          .get(`/v0/build/${build.id}`)
          .set('Cookie', cookie)
          .expect(200)
      )
      .then((response) => {
        buildResponseExpectations(response.body, build);
        validateAgainstJSONSchema('GET', '/build/{id}', 200, response.body);
        done();
      })
      .catch(done);
    });

    it('should respond with a 403 if the current user is not associated with the build', (done) => {
      let build;

      factory.build().then((model) => {
        build = model;
        return authenticatedSession(factory.user());
      })
      .then(cookie =>
        request(app)
          .get(`/v0/build/${build.id}`)
          .set('Cookie', cookie)
          .expect(403)
      )
      .then((response) => {
        validateAgainstJSONSchema('GET', '/build/{id}', 403, response.body);
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
      const buildsPromise = Promise.all(
        Array(110).fill(0).map(() => factory.build({ site: sitePromise }))
      );
      const cookiePromise = authenticatedSession(userPromise);

      Promise.props({
        site: sitePromise,
        cookie: cookiePromise,
        builds: buildsPromise,
      })
      .then(({ site, cookie }) =>
        request(app)
          .get(`/v0/site/${site.id}/build`)
          .set('Cookie', cookie)
          .expect(200)
      )
      .then((response) => {
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.length(100);
        done();
      })
      .catch(done);
    }).timeout(2000); // this test can take a long time because of all the builds it creates
  });

  describe('POST /v0/build/:id/status/:token', () => {
    const encode64 = str => new Buffer(str, 'utf8').toString('base64');

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

    it('should mark a build successful if status is 0 and message is blank', (done) => {
      let build;

      factory.build({ commitSha })
      .then((model) => {
        build = model;
      })
      .then(() =>
        postBuildStatus({
          build,
          status: '0',
          message: '',
        }).expect(200)
      )
      .then(() => Build.findById(build.id))
      .then((updatedBuild) => {
        expect(updatedBuild).to.not.be.undefined;
        expect(updatedBuild.state).to.equal('success');
        expect(updatedBuild.error).to.equal('');
        expect(new Date() - updatedBuild.completedAt).to.be.below(1000);
        done();
      })
      .catch(done);
    });

    it('should mark a build errored if the status is non-zero and should set the message', (done) => {
      let build;

      factory.build({ commitSha })
      .then((model) => {
        build = model;
      })
      .then(() =>
        postBuildStatus({
          build,
          status: '1',
          message: 'The build failed for a reason',
        }).expect(200)
      )
      .then(() => Build.findById(build.id))
      .then((updatedBuild) => {
        expect(updatedBuild).to.not.be.undefined;
        expect(updatedBuild.state).to.equal('error');
        expect(updatedBuild.error).to.equal('The build failed for a reason');
        expect(new Date() - updatedBuild.completedAt).to.be.below(1000);
        done();
      })
      .catch(done);
    });

    it('should update the publishedAt field for the site if the build is successful', (done) => {
      let siteId;
      const sitePromise = factory.site();

      Promise.props({
        site: sitePromise,
        build: factory.build({
          site: sitePromise,
          commitSha,
        }),
      })
      .then((promisedValues) => {
        expect(promisedValues.site.publishedAt).to.be.null;
        siteId = promisedValues.site.id;

        return postBuildStatus({
          build: promisedValues.build,
          status: '0',
          message: '',
        });
      })
      .then(() => Site.findById(siteId))
      .then((site) => {
        expect(site.publishedAt).to.be.a('date');
        expect(new Date().getTime() - site.publishedAt.getTime()).to.be.below(500);
        done();
      })
      .catch(done);
    });

    it('should report the build\'s status back to github', (done) => {
      nock.cleanAll();
      const statusNock = githubAPINocks.status({ state: 'success' });

      factory.build({ commitSha })
      .then(build =>
        postBuildStatus({
          build,
          status: '0',
          message: '',
        })
      )
      .then(() => {
        expect(statusNock.isDone()).to.be.true;
        done();
      })
      .catch(done);
    });

    it('should respond with a 404 for a build that does not exist', (done) => {
      postBuildStatus({
        build: { id: 'invalid-build-id', token: 'invalid-token' },
        status: '0',
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
          status: '0',
          message: '',
        }).expect(403)
      )
      .then(() => Build.findById(build.id))
      .then((unmodifiedBuild) => {
        expect(unmodifiedBuild).to.not.be.undefined;
        expect(unmodifiedBuild.state).to.equal('processing');
        done();
      })
      .catch(done);
    });
  });
});
