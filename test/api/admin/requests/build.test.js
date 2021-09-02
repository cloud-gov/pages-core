const request = require('supertest');
const { expect } = require('chai');

const validateAgainstJSONSchema = require('../../support/validateAgainstJSONSchema');
const { authenticatedSession } = require('../../support/session');
const factory = require('../../support/factory');
const csrfToken = require('../../support/csrfToken');

const config = require('../../../../config');
const { Site, User, BuildLog } = require('../../../../api/models');
const sessionConfig = require('../../../../api/admin/sessionConfig');
const app = require('../../../../api/admin');

const itShouldRequireAdminAuthentication = (path, schema, method = 'get') => {
  it('should require admin authentication', async () => {
    const response = await request(app)[method](path)
      .expect(401);
    validateAgainstJSONSchema('GET', schema, 401, response.body);
    expect(response.body.message).to.equal('Unauthorized');
  });
};

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

describe('Admin - Site API', () => {
  afterEach(() => Promise.all([
    User.truncate(),
    Site.truncate(),
  ]));

  describe('GET /admin/builds', () => {
    itShouldRequireAdminAuthentication('/builds', '/site/{site_id}/build');

    it('returns all site builds with admin serialization', async () => {
      const user = await factory.user();
      const site = await factory.site();
      const [...builds] = await Promise.all([
        factory.build({ site: site.id }),
        factory.build({ site: site.id }),
        factory.build({ site: site.id }),
      ]);

      const cookie = await authenticatedSession(user, sessionConfig);
      const response = await request(app)
        .get(`/builds?site=${site.id}&limit=10`)
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .expect(200);
    
      builds.forEach((build) => {
        const responseBuild = response.body.data.find(candidate => candidate.id === build.id);
        buildResponseExpectations(responseBuild, build);
      });

      validateAgainstJSONSchema('GET', '/site/{site_id}/build', 200, response.body.data);
      expect(response.body.data.length).equal(builds.length);
      response.body.data.forEach(d => expect(builds.map(b => b.id)).include(d.id));
    });
  });

  describe('GET /admin/builds/:id', () => {
    itShouldRequireAdminAuthentication('/builds/1', '/build/{id}');

    it('returns the site with admin serialization', async () => {

      const user = await factory.user();
      const build = await factory.build();//.{ site: site.id });

      const cookie = await authenticatedSession(user, sessionConfig);
      const { body } = await request(app)
        .get(`/builds/${build.id}`)
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .expect(200);
      validateAgainstJSONSchema('GET', '/build/{id}', 200, body);
      expect(body.id).to.equal(build.id);
      buildResponseExpectations(body, build);
    });
  });
  describe('PUT /admin/builds/:id', () => {
    itShouldRequireAdminAuthentication('/builds/1', '/build/{id}', 'put');

    const origState = 'processing';
    const newState = 'error';

    it('updates allowed fields', async () => {
      const user = await factory.user();
      const build = await factory.build({ state: origState });
      const cookie = await authenticatedSession(user, sessionConfig);
      const putResponse = await request(app)
        .put(`/builds/${build.id}`)
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .send({
          state: newState,
        })
        .expect(200);

      expect(putResponse.body.state).to.deep.equal(newState);
      validateAgainstJSONSchema('GET', '/build/{id}', 200, putResponse.body);

      // Requery
      const getResponse = await request(app)
        .get(`/builds/${build.id}`)
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .expect(200);        

        expect(getResponse.body.state).to.deep.equal(newState);
        validateAgainstJSONSchema('PUT', '/build/{id}', 200, getResponse.body);
    });
  });
  
  describe('GET /builds/:id/log', () => {
    itShouldRequireAdminAuthentication('/builds/1/log', '/build/{build_id}/log');

    describe('default', () => {

      it('deletes the following site', async () => {
        const [user, build] = await Promise.all([
          factory.user(),
          factory.build(),
        ]);
        const logs = await BuildLog.bulkCreate(
          Array(5).fill(0).map(() => ({
            output: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam fringilla, arcu ut ultricies auctor, elit quam consequat neque, eu blandit metus lorem non turpis.',
            source: 'ALL',
            build: build.id,
          }))
        );

        const cookie = await authenticatedSession(user, sessionConfig);
        const response = await request(app)
          .get(`/builds/${build.id}/log`)
          .set('Cookie', cookie)
          .set('Origin', config.app.adminHostname)
          .set('x-csrf-token', csrfToken.getToken())
          .expect(200);

          expect(response.body).to.be.a('string');
          expect(response.body.split('\n')).to.have.length(5);
      });
    });
  });
});
