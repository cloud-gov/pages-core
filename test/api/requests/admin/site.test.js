const { expect } = require('chai');
const request = require('supertest');

const app = require('../../../../app');
const factory = require('../../support/factory');
const { adminAuthenticatedSession, authenticatedSession } = require('../../support/session');
const validateAdminJSONSchema = require('../../support/validateAdminJSONSchema');

const { Site, User } = require('../../../../api/models');

const authErrorMessage = 'You are not permitted to perform this action. Are you sure you are logged in?';

describe('Site Admin API', () => {
  const siteResponseExpectations = (response, site) => {
    expect(response.owner).to.equal(site.owner);
    expect(response.repository).to.equal(site.repository);
    expect(response.engine).to.equal(site.engine);
    expect(response.defaultBranch).to.equal(site.defaultBranch);
  };

  afterEach(() => Site.truncate());

  describe('GET /admin/sites', () => {
    it('should require authentication', (done) => {
      factory.build().then(() => request(app)
        .get('/admin/sites')
        .expect(403))
        .then((response) => {
          validateAdminJSONSchema('GET', '/sites', 403, response.body);
          expect(response.body.message).to.equal(authErrorMessage);
          done();
        })
        .catch(done);
    });

    it('should reject a user that is not an admin', (done) => {
      let user;

      factory.user().then((model) => {
        user = model;
        const sitePromises = Array(3).fill(0).map(() => factory.site({ users: [user.id] }));
        return Promise.all(sitePromises);
      })
        .then(() => authenticatedSession(user))
        .then(cookie => request(app)
          .get('/admin/sites')
          .set('Cookie', cookie)
          .expect(403))
        .then((response) => {
          validateAdminJSONSchema('GET', '/sites', 403, response.body);
          expect(response.body.message).to.equal(authErrorMessage);
          done();
        })
        .catch(done);
    });

    it('should render a list of sites', (done) => {
      let user;
      let sites;
      let response;

      factory.user().then((model) => {
        user = model;
        const sitePromises = Array(3).fill(0).map(() => factory.site({ users: [user.id] }));
        return Promise.all(sitePromises);
      }).then((models) => {
        sites = models;
        return adminAuthenticatedSession(user);
      }).then(cookie => request(app)
        .get('/admin/sites')
        .set('Cookie', cookie)
        .expect(200))
        .then((resp) => {
          response = resp;
          validateAdminJSONSchema('GET', '/sites', 200, response.body);

          expect(response.body).to.be.a('array');
          expect(response.body).to.have.length(3);

          return Promise.all(sites.map(site => Site.findByPk(site.id, { include: [User] })));
        })
        .then((foundSites) => {
          foundSites.forEach((site) => {
            const responseSite = response.body.find(candidate => candidate.id === site.id);
            expect(responseSite).not.to.be.undefined;
            siteResponseExpectations(responseSite, site);
          });
          done();
        })
        .catch(done);
    });
  });

  describe('GET /admin/site/:id', () => {
    it('should require authentication', (done) => {
      factory.site().then(site => request(app)
        .get(`/admin/site/${site.id}`)
        .expect(403))
        .then((response) => {
          validateAdminJSONSchema('GET', '/site/{id}', 403, response.body);
          expect(response.body.message).to.equal(authErrorMessage);
          done();
        })
        .catch(done);
    });

    it('should reject a user that is not an admin', (done) => {
      let site;

      factory.site()
        .then(s => Site.findByPk(s.id, { include: [User] }))
        .then((model) => {
          site = model;
          return authenticatedSession(site.Users[0]);
        })
        .then(cookie => request(app)
          .get(`/admin/site/${site.id}`)
          .set('Cookie', cookie)
          .expect(403))
        .then((response) => {
          validateAdminJSONSchema('GET', '/site/{id}', 403, response.body);
          expect(response.body.message).to.equal(authErrorMessage);
          done();
        })
        .catch(done);
    });

    it('should render a JSON representation of the site', (done) => {
      let site;

      factory.site()
        .then(s => Site.findByPk(s.id, { include: [User] }))
        .then((model) => {
          site = model;
          return adminAuthenticatedSession(site.Users[0]);
        })
        .then(cookie => request(app)
          .get(`/admin/site/${site.id}`)
          .set('Cookie', cookie)
          .expect(200))
        .then((response) => {
          validateAdminJSONSchema('GET', '/site/{id}', 200, response.body);
          siteResponseExpectations(response.body, site);
          done();
        })
        .catch(done);
    });

    it('should respond with a 403 if the user is not associated with the site', (done) => {
      let site;

      factory.site().then((model) => {
        site = model;
        return adminAuthenticatedSession(factory.user());
      }).then(cookie => request(app)
        .get(`/admin/site/${site.id}`)
        .set('Cookie', cookie)
        .expect(403))
        .then((response) => {
          validateAdminJSONSchema('GET', '/site/{id}', 403, response.body);
          done();
        })
        .catch(done);
    });
  });
});
