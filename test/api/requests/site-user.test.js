const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const app = require('../../../app');
const factory = require('../support/factory');
const { authenticatedSession, unauthenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const csrfToken = require('../support/csrfToken');
const { Site, User } = require('../../../api/models');
const SQS = require('../../../api/services/SQS');

const authErrorMessage = 'You are not permitted to perform this action. Are you sure you are logged in?';

describe('SiteUser API', () => {
  beforeEach(() => {
    sinon.stub(SQS, 'sendBuildMessage').resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('PUT /v0/site/:site_id/notifications', () => {
    it('should require authentication', (done) => {
      let site;

      factory.site({
        users: Promise.all([factory.user()]),
      })
      .then(s => Site.findByPk(s.id, { include: [User] }))
      .then((model) => {
        site = model;
        expect(site.Users[0].SiteUser.buildNotificationSetting).to.equal('site');
        return unauthenticatedSession();
      })
      .then(cookie => request(app)
        .put(`/v0/site/${site.id}/notifications`)
        .set('x-csrf-token', csrfToken.getToken())
        .send({ buildNotificationSetting: 'builds' })
        .set('Cookie', cookie)
        .expect(403)
      )
      .then((response) => {
        validateAgainstJSONSchema('PUT', '/site/{id}', 403, response.body);
        expect(response.body.message).to.equal(authErrorMessage);
        done();
      })
      .catch(done);
    });

    it('should require a valid csrf token', (done) => {
      let site;

      factory.site({
        users: Promise.all([factory.user()]),
      })
      .then((model) => {
        site = model;
        return authenticatedSession();
      })
      .then(cookie => request(app)
        .put(`/v0/site/${site.id}/notifications`)
        .set('x-csrf-token', 'bad-token')
        .send({ buildNotificationSetting: 'builds' })
        .set('Cookie', cookie)
        .expect(403)
      )
      .then((response) => {
        validateAgainstJSONSchema('PUT', '/site/{id}', 403, response.body);
        expect(response.body.message).to.equal('Invalid CSRF token');
        done();
      })
      .catch(done);
    });

    it('should allow user to update buildNotificationSetting for a site', (done) => {
      let site;

      factory.site({
        users: Promise.all([factory.user()]),
      })
      .then(s => Site.findByPk(s.id, { include: [User] }))
      .then((model) => {
        site = model;
        expect(site.Users[0].SiteUser.buildNotificationSetting).to.equal('site');
        return authenticatedSession(site.Users[0]);
      })
      .then(cookie => request(app)
        .put(`/v0/site/${site.id}/notifications`)
        .set('x-csrf-token', csrfToken.getToken())
        .send({ buildNotificationSetting: 'builds' })
        .set('Cookie', cookie)
        .expect(200)
      )
      .then((response) => {
        validateAgainstJSONSchema('PUT', '/site/{id}', 200, response.body);
        expect(response.body.users[0].buildNotificationSetting).to.equal('builds');
        done();
      })
      .catch(done);
    });

    it('should not allow user to update buildNotificationSetting', (done) => {
      let siteModel;

      factory.site({
        users: Promise.all([factory.user()]),
      })
      .then((model) => {
        siteModel = model;
        return authenticatedSession(factory.user());
      })
      .then(cookie => request(app)
          .put(`/v0/site/${siteModel.id}/notifications`)
          .set('x-csrf-token', csrfToken.getToken())
          .send({ buildNotificationSetting: 'builds' })
          .set('Cookie', cookie)
          .expect(404)
      )
      .then((response) => {
        validateAgainstJSONSchema('PUT', '/site/{id}', 404, response.body);
        expect(response.status).to.equal(404);
        expect(response.body.message).to.eq('Not found');
        done();
      })
      .catch(done);
    });


    it('should not update attributes when value in the request body is empty string', (done) => {
      let site;

      const userPromise = factory.user();
      const sitePromise = factory.site({
        users: Promise.all([userPromise]),
      });
      const cookiePromise = authenticatedSession(userPromise);

      Promise.props({
        user: userPromise,
        site: sitePromise,
        cookie: cookiePromise,
      })
      .then((results) => {
        site = results.site;

        return request(app)
          .put(`/v0/site/${site.id}/notifications`)
          .set('x-csrf-token', csrfToken.getToken())
          .send({ buildNotificationSetting: '', site_users: '', user_sites: '' })
          .set('Cookie', results.cookie)
          .expect(200);
      })
      .then((response) => {
        validateAgainstJSONSchema('PUT', '/site/{id}', 200, response.body);
        return Site.withUsers(site.id);
      })
      .then((foundSite) => {
        const siteUser = foundSite.Users[0].SiteUser;
        expect(siteUser.buildNotificationSetting).to.equal('site');
        expect(siteUser.site_users).to.equal(site.id);
        expect(siteUser.user_sites).to.equal(foundSite.Users[0].id);
        done();
      })
      .catch(done);
    });

    it('should not override existing atts if they are not present in the request body', (done) => {
      let site;

      const userPromise = factory.user();
      const sitePromise = factory.site({
        users: Promise.all([userPromise]),
        config: 'old-config: true',
        domain: 'https://example.com',
      });
      const cookiePromise = authenticatedSession(userPromise);

      Promise.props({
        user: userPromise,
        site: sitePromise,
        cookie: cookiePromise,
      })
      .then((results) => {
        site = results.site;

        return request(app)
          .put(`/v0/site/${site.id}/notifications`)
          .set('x-csrf-token', csrfToken.getToken())
          .send({
            config: 'new-config: true',
          })
          .set('Cookie', results.cookie)
          .expect(200);
      })
      .then((response) => {
        validateAgainstJSONSchema('PUT', '/site/{id}', 200, response.body);
        return Site.withUsers(site.id);
      })
      .then((foundSite) => {
        const siteUser = foundSite.Users[0].SiteUser;
        expect(siteUser.buildNotificationSetting).to.equal('site');
        expect(siteUser.site_users).to.equal(site.id);
        expect(siteUser.user_sites).to.equal(foundSite.Users[0].id);
        done();
      })
      .catch(done);
    });
  });

  it('should return 404 for a site id NaN', (done) => {
    factory.user()
    .then(user => authenticatedSession(user))
    .then(cookie => request(app)
      .put('/v0/site/NaN/notifications')
      .set('x-csrf-token', csrfToken.getToken())
      .send({ buildNotificationSetting: 'builds' })
      .set('Cookie', cookie)
      .expect(404)
    )
    .then((response) => {
      validateAgainstJSONSchema('PUT', '/site/{id}', 404, response.body);
      expect(response.status).to.equal(404);
      expect(response.body.message).to.eq('Not found');
      done();
    })
    .catch(done);
  });

  it('should return 404 for a site not found', (done) => {
    factory.user()
    .then(user => authenticatedSession(user))
    .then(cookie => request(app)
      .put('/v0/site/0/notifications')
      .set('x-csrf-token', csrfToken.getToken())
      .send({ buildNotificationSetting: 'builds' })
      .set('Cookie', cookie)
      .expect(404)
    )
    .then((response) => {
      validateAgainstJSONSchema('PUT', '/site/{id}', 404, response.body);
      expect(response.status).to.equal(404);
      expect(response.body.message).to.eq('Not found');
      done();
    })
    .catch(done);
  });

  it('should return 404 when the user is not a collaborator', (done) => {
    factory.site()
    .then(() => factory.user())
    .then(user => authenticatedSession(user))
    .then(cookie => request(app)
      .put('/v0/site/NaN/notifications')
      .set('x-csrf-token', csrfToken.getToken())
      .send({ buildNotificationSetting: 'builds' })
      .set('Cookie', cookie)
      .expect(404)
    )
    .then((response) => {
      validateAgainstJSONSchema('PUT', '/site/{id}', 404, response.body);
      expect(response.status).to.equal(404);
      expect(response.body.message).to.eq('Not found');
      done();
    })
    .catch(done);
  });
});
