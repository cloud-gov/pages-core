const { expect } = require('chai');
const request = require('supertest');

const app = require('../../../app');
const factory = require('../support/factory');
const { authenticatedSession, unauthenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const csrfToken = require('../support/csrfToken');
const { Site, User } = require('../../../api/models');

const authErrorMessage = 'You are not permitted to perform this action. Are you sure you are logged in?';

describe('SiteUser API', () => {
  describe('PUT /v0/siteUser/:id', () => {
    it('should require authentication', (done) => {
      let site;

      factory.site({
        users: Promise.all([factory.user()]),
      })
      .then(s => Site.findById(s.id, { include: [User] }))
      .then((model) => {
        site = model;
        expect(site.Users[0].SiteUser.buildNotify).to.equal('site');
        return unauthenticatedSession();
      })
      .then(cookie => request(app)
        .put(`/v0/siteUser/${site.id}`)
        .set('x-csrf-token', csrfToken.getToken())
        .send({ buildNotify: 'builds' })
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
        .put(`/v0/siteUser/${site.id}`)
        .set('x-csrf-token', 'bad-token')
        .send({ buildNotify: 'builds' })
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

    it('should allow user to update buildNotify for site assoc. with their account', (done) => {
      let site;

      factory.site({
        users: Promise.all([factory.user()]),
      })
      .then(s => Site.findById(s.id, { include: [User] }))
      .then((model) => {
        site = model;
        expect(site.Users[0].SiteUser.buildNotify).to.equal('site');
        return authenticatedSession(site.Users[0]);
      })
      .then(cookie => request(app)
        .put(`/v0/siteUser/${site.id}`)
        .set('x-csrf-token', csrfToken.getToken())
        .send({ buildNotify: 'builds' })
        .set('Cookie', cookie)
        .expect(200)
      )
      .then((response) => {
        validateAgainstJSONSchema('PUT', '/site/{id}', 200, response.body);
        expect(response.body.users[0].buildNotify).to.equal('builds');
        done();
      })
      .catch(done);
    });

    it('should not allow user to update buildNotify for site not assoc. with account', (done) => {
      let siteModel;

      factory.site({
        users: Promise.all([factory.user()]),
      })
      .then((model) => {
        siteModel = model;
        return authenticatedSession(factory.user());
      })
      .then(cookie => request(app)
          .put(`/v0/siteUser/${siteModel.id}`)
          .set('x-csrf-token', csrfToken.getToken())
          .send({ buildNotify: 'builds' })
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
          .put(`/v0/siteUser/${site.id}`)
          .set('x-csrf-token', csrfToken.getToken())
          .send({ buildNotify: '', site_users: '', user_sites: '' })
          .set('Cookie', results.cookie)
          .expect(200);
      })
      .then((response) => {
        validateAgainstJSONSchema('PUT', '/site/{id}', 200, response.body);
        return Site.withUsers(site.id);
      })
      .then((foundSite) => {
        const siteUser = foundSite.Users[0].SiteUser;
        expect(siteUser.buildNotify).to.equal('site');
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
          .put(`/v0/siteUser/${site.id}`)
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
        expect(siteUser.buildNotify).to.equal('site');
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
      .put('/v0/siteUser/NaN')
      .set('x-csrf-token', csrfToken.getToken())
      .send({ buildNotify: 'builds' })
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
      .put('/v0/siteUser/0')
      .set('x-csrf-token', csrfToken.getToken())
      .send({ buildNotify: 'builds' })
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
      .put('/v0/siteUser/NaN')
      .set('x-csrf-token', csrfToken.getToken())
      .send({ buildNotify: 'builds' })
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
