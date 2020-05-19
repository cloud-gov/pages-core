const { expect } = require('chai');
const request = require('supertest');
const { stub } = require('sinon');
const app = require('../../../../app');
const SQS = require('../../../../api/services/SQS');
const factory = require('../../support/factory');
const { adminAuthenticatedSession, authenticatedSession } = require('../../support/session');
const validateAdminJSONSchema = require('../../support/validateAdminJSONSchema');

const authErrorMessage = 'You are not permitted to perform this action. Are you sure you are logged in?';

describe('Build Admin API', () => {
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

  describe('GET /admin/builds', () => {
    it('should require authentication', (done) => {
      factory.build().then(() => request(app)
        .get('/admin/builds')
        .expect(403))
        .then((response) => {
          validateAdminJSONSchema('GET', '/builds', 403, response.body);
          expect(response.body.message).to.equal(authErrorMessage);
          done();
        })
        .catch(done);
    });

    it('should reject a user that is not an admin', (done) => {
      const userPromise = factory.user();
      const sitePromise = factory.site({ users: Promise.all([userPromise]) });
      const cookiePromise = authenticatedSession(userPromise);

      Promise.props({
        site: sitePromise,
        cookie: cookiePromise,
        user: userPromise,
      })
        .then(props => factory
          .bulkBuild({ site: props.site.id, user: props.user.id }, 10)
          .then(() => props))
        .then(({ cookie }) => request(app)
          .get('/admin/builds')
          .set('Cookie', cookie)
          .expect(403))
        .then((response) => {
          validateAdminJSONSchema('GET', '/builds', 403, response.body);
          expect(response.body.message).to.equal(authErrorMessage);
          done();
        })
        .catch(done);
    });

    it('shouldn\'t list more than default 50 builds', (done) => {
      const userPromise = factory.user();
      const sitePromise = factory.site({ users: Promise.all([userPromise]) });
      const cookiePromise = adminAuthenticatedSession(userPromise);

      Promise.props({
        site: sitePromise,
        cookie: cookiePromise,
        user: userPromise,
      })
        .then(props => factory
          .bulkBuild({ site: props.site.id, user: props.user.id }, 110)
          .then(() => props))
        .then(({ cookie }) => request(app)
          .get('/admin/builds')
          .set('Cookie', cookie)
          .expect(200))
        .then((response) => {
          expect(response.body).to.be.an('array');
          expect(response.body).to.have.length(50);
          done();
        })
        .catch(done);
    });
  });

  describe('GET /admin/site/:site_id/build', () => {
    it('should require authentication', (done) => {
      factory.site()
        .then(site => request(app)
          .get(`/admin/site/${site.id}/build`)
          .expect(403))
        .then((response) => {
          validateAdminJSONSchema('GET', '/site/{site_id}/build', 403, response.body);
          done();
        })
        .catch(done);
    });

    it('should reject a user that is not an admin', (done) => {
      let site;

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
          ({ site } = promisedValues);
          const { cookie } = promisedValues;

          return request(app)
            .get(`/admin/site/${site.id}/build`)
            .set('Cookie', cookie)
            .expect(403);
        })
        .then((response) => {
          validateAdminJSONSchema('GET', '/site/{site_id}/build', 403, response.body);
          expect(response.body.message).to.equal(authErrorMessage);
          done();
        })
        .catch(done);
    });

    it('should list builds for a site', (done) => {
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
        cookie: adminAuthenticatedSession(userPromise),
      })
        .then((promisedValues) => {
          ({ site, builds } = promisedValues);
          const { cookie } = promisedValues;

          return request(app)
            .get(`/admin/site/${site.id}/build`)
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

          validateAdminJSONSchema('GET', '/site/{site_id}/build', 200, response.body);
          done();
        })
        .catch(done);
    });

    it('shouldn\'t list more than 100 builds', (done) => {
      const userPromise = factory.user();
      const sitePromise = factory.site({ users: Promise.all([userPromise]) });
      const cookiePromise = adminAuthenticatedSession(userPromise);

      Promise.props({
        site: sitePromise,
        cookie: cookiePromise,
        user: userPromise,
      })
        .then(props => factory
          .bulkBuild({ site: props.site.id, user: props.user.id }, 110)
          .then(() => props))
        .then(({ site, cookie }) => request(app)
          .get(`/admin/site/${site.id}/build`)
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
        cookie: adminAuthenticatedSession(userPromise),
      })
        .then((promisedValues) => {
          const { cookie } = promisedValues;
          return request(app)
            .get('/admin/site/-1000/build')
            .set('Cookie', cookie)
            .expect(404);
        })
        .then((response) => {
          validateAdminJSONSchema('GET', '/site/{site_id}/build', 404, response.body);
          done();
        })
        .catch(done);
    });

    it('should not display build when site id is NaN', (done) => {
      const userPromise = factory.user();
      Promise.props({
        user: userPromise,
        cookie: adminAuthenticatedSession(userPromise),
      })
        .then(promisedValues => request(app)
          .get('/admin/site/NaN/build')
          .set('Cookie', promisedValues.cookie)
          .expect(404))
        .then((response) => {
          validateAdminJSONSchema('GET', '/site/{site_id}/build', 404, response.body);
          done();
        })
        .catch(done);
    });
  });
});
