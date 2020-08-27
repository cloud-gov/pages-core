const request = require('supertest');
const { expect } = require('chai');

const validateAgainstJSONSchema = require('../../support/validateAgainstJSONSchema');
const { authenticatedSession } = require('../../support/session');
const factory = require('../../support/factory');

const { Site, User } = require('../../../../api/models');
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

describe('Admin - Site API', () => {
  afterEach(() => Promise.all([
    User.truncate(),
    Site.truncate(),
  ]));

  describe('GET /admin/sites', () => {
    itShouldRequireAdminAuthentication('/sites', '/site');

    it('returns all sites with admin serialization', async () => {
      const [user, ...sites] = await Promise.all([
        factory.user(),
        factory.site(),
        factory.site(),
      ]);

      const cookie = await authenticatedSession(user, sessionConfig);
      const { body } = await request(app)
        .get('/sites')
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema('GET', '/site', 200, body);
      expect(body.map(site => site.id)).to.deep.equal(sites.map(s => s.id));
      expect(body[0].containerConfig).to.deep.equal({});
    });
  });

  describe('GET /admin/sites/:id', () => {
    itShouldRequireAdminAuthentication('/sites/1', '/site/{id}');

    it('returns the site with admin serialization', async () => {
      const containerConfig = { name: 'name', size: 'size' };

      const [user, site] = await Promise.all([
        factory.user(),
        factory.site({ containerConfig }),
      ]);

      const cookie = await authenticatedSession(user, sessionConfig);
      const { body } = await request(app)
        .get(`/sites/${site.id}`)
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema('GET', '/site/{id}', 200, body);
      expect(body.id).to.equal(site.id);
      expect(body.containerConfig).to.deep.equal(containerConfig);
    });
  });
  describe('PUT /admin/sites/:id', () => {
    itShouldRequireAdminAuthentication('/sites/1', '/site/{id}', 'put');

    const origContainerConfig = { name: 'exp', size: '' };
    const newContainerConfig = { name: '', size: 'large' };

    it('updates allowed fields', async () => {
      const [user, site] = await Promise.all([
        factory.user(),
        factory.site({ containerConfig: origContainerConfig }),
      ]);

      const cookie = await authenticatedSession(user, sessionConfig);
      const putResponse = await request(app)
        .put(`/sites/${site.id}`)
        .set('Cookie', cookie)
        .send({
          containerConfig: newContainerConfig,
        })
        .expect(200);

      expect(putResponse.body.containerConfig).to.deep.equal(newContainerConfig);

      // Requery
      const getResponse = await request(app)
        .get(`/sites/${site.id}`)
        .set('Cookie', cookie)
        .expect(200);

      expect(getResponse.body.containerConfig).to.deep.equal(newContainerConfig);
    });
  });
});
