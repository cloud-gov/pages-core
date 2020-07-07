const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const factory = require('../support/factory');
const csrfToken = require('../support/csrfToken');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const app = require('../../../app');
const config = require('../../../config');
const { Site } = require('../../../api/models');
const ProxyDataSync = require('../../../api/services/ProxyDataSync');

describe('Site basic authentication API', () => {
  afterEach(() => {
    sinon.restore();
  });
  describe('DELETE /v0/site/:site_id/basic-auth', () => {
    describe('when the user is not authenticated', () => {
      it('returns a 403', async () => {
        const siteId = 1;

        const { body } = await request(app)
          .delete(`/v0/site/${siteId}/basic-auth`)
          .expect(403);

        validateAgainstJSONSchema('DELETE', '/site/{site_id}/basic-auth', 403, body);
      });
    });

    describe('when the site does not exist', () => {
      it('returns a 404', async () => {
        const siteId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .delete(`/v0/site/${siteId}/basic-auth`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema('DELETE', '/site/{site_id}/basic-auth', 404, body);
      });
    });

    describe('when the user is not authorized to see the site', () => {
      it('returns a 404', async () => {
        const uevId = 1;
        const [site, user] = await Promise.all([
          factory.site(),
          factory.user(),
        ]);
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .delete(`/v0/site/${site.id}/basic-auth`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema('DELETE', '/site/{site_id}/basic-auth', 404, body);
      });
    });

    describe('when the parameters are valid', () => {
      it('deletes basic auth from config and returns a 200', async () => {
        const userPromise = await factory.user();
        const config = { 
          basicAuth: {
            username: 'user',
            password: 'password'
          },
          blah: 'blahblah'
        };
        let site = await factory.site({
          users: [userPromise],
          config,
        });

        sinon.stub(ProxyDataSync, 'saveSite').resolves();

        const cookie = await authenticatedSession(userPromise);
        expect(site.config).to.deep.eq(config);
        const { body } = await request(app)
          .delete(`/v0/site/${site.id}/basic-auth`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(200);

        site = await site.reload();
        expect(site.config).to.deep.eq({ blah: 'blahblah' });
        expect(body).to.deep.eq({});
      });
    });
  });

  describe('GET /v0/site/:site_id/basic-auth', () => {
    describe('when the user is not authenticated', () => {
      it('returns a 403', async () => {
        const siteId = 1;

        const { body } = await request(app)
          .get(`/v0/site/${siteId}/basic-auth`)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema('GET', '/site/{site_id}/basic-auth', 403, body);
      });
    });

    describe('when the site does not exist', () => {
      it('returns a 404', async () => {
        const siteId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/site/${siteId}/basic-auth`)
          .set('Cookie', cookie)
          .type('json')
          .expect(404);

        validateAgainstJSONSchema('GET', '/site/{site_id}/basic-auth', 404, body);
      });
    });

    describe('when the user is not authorized to see the site', () => {
      it('returns a 404', async () => {
        const [site, user] = await Promise.all([
          factory.site(),
          factory.user(),
        ]);
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/site/${site.id}/basic-auth`)
          .set('Cookie', cookie)
          .type('json')
          .expect(404);

        validateAgainstJSONSchema('GET', '/site/{site_id}/basic-auth', 404, body);
      });
    });

    describe('when basic auth is not implemented for the site', () => {
      it('returns an empty array', async () => {
        const config = { blah: 'blahblah' };
        const userPromise = await factory.user();
        let site = await factory.site({ users: [userPromise], config });
        const cookie = await authenticatedSession(userPromise);

        const { body } = await request(app)
          .get(`/v0/site/${site.id}/basic-auth`)
          .set('Cookie', cookie)
          .type('json')
          .expect(200);

        validateAgainstJSONSchema('GET', '/site/{site_id}/basic-auth', 200, body);
        site = await site.reload();
        expect(site.config).to.deep.eq(config);
        expect(body).to.deep.eq({});
      });
    });

    describe('when there is basic auth set for the site', () => {
      it('returns a site with basic auth credentials', async () => {
        const userPromise = await factory.user();
        const config = { 
          basicAuth: {
            username: 'user',
            password: 'password'
          },
        };
        const site = await factory.site({ users: [userPromise], config });
        
        const cookie = await authenticatedSession(userPromise);

        const { body } = await request(app)
          .get(`/v0/site/${site.id}/basic-auth`)
          .set('Cookie', cookie)
          .type('json')
          .expect(200);

        validateAgainstJSONSchema('GET', '/site/{site_id}/basic-auth', 200, body);
        expect(body).to.deep.eq({
          username: config.basicAuth.username,
          password: '**********',
        });
      });
    });
  });

  describe('POST /v0/site/:site_id/basic-auth', () => {
    describe('when the user is not authenticated', () => {
      it('returns a 403', async () => {
        const siteId = 1;

        const { body } = await request(app)
          .post(`/v0/site/${siteId}/basic-auth`)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema('POST', '/site/{site_id}/basic-auth', 403, body);
      });
    });

    describe('when there is no csrf token', () => {
      it('returns a 403', async () => {
        const siteId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${siteId}/basic-auth`)
          .set('Cookie', cookie)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema('POST', '/site/{site_id}/basic-auth', 403, body);
      });
    });

    describe('when the site does not exist', () => {
      it('returns a 404', async () => {
        const siteId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${siteId}/basic-auth`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema('POST', '/site/{site_id}/basic-auth', 404, body);
      });
    });

    describe('when the user is not authorized to see the site', () => {
      it('returns a 404', async () => {
        const [site, user] = await Promise.all([
          factory.site(),
          factory.user(),
        ]);
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/basic-auth`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema('POST', '/site/{site_id}/basic-auth', 404, body);
      });
    });

    describe('when the parameters are not valid', () => {
      it('returns a 400', async () => {
        const userPromise = await factory.user();
        const site = await factory.site({ users: [userPromise] });
        const cookie = await authenticatedSession(userPromise);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/basic-auth`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({})
          .expect(400);

        validateAgainstJSONSchema('POST', '/site/{site_id}/basic-auth', 400, body);
      });
    });

    describe('when the parameters are valid', () => {
      it('sets username and password for basic authentication', async () => {
        const userPromise = await factory.user();
        let site = await factory.site({
          users: [userPromise],
          config: { blah: 'blahblahblah' },
        });
        const cookie = await authenticatedSession(userPromise);
        const credentials = { 
          username: 'user',
          password: 'password',
        };

        sinon.stub(ProxyDataSync, 'saveSite').resolves();

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/basic-auth`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send(credentials)
          .expect(200);


        validateAgainstJSONSchema('POST', '/site/{site_id}/basic-auth', 200, body);
        site = await site.reload();
        expect(site.config).to.deep.eq({
          basicAuth: credentials,
          blah: 'blahblahblah',
        });
        expect(body).to.deep.eq({
          username: credentials.username,
          password: '**********',
        });
      });
    });
  });
});
