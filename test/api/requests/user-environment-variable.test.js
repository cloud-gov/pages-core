const { expect } = require('chai');
const request = require('supertest');
const app = require('../../../app');
const factory = require('../support/factory');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const { UserEnvironmentVariable } = require('../../../api/models');

describe.only('User Environment Variable API', () => {
  describe('DELETE /v0/site/:site_id/user-environment-variable/:uev_id', () => {
  });

  describe('GET /v0/site/:site_id/user-environment-variable', () => {
    describe('when the user is not authenticated', () => {
      it('returns a 404', async () => {
        const siteId = 1;
        const { body } = await request(app)
          .get(`/v0/site/${siteId}/user-environment-variable`)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema('GET', '/site/{site_id}/user-environment-variable', 403, body);
      });
    });

    describe('when the site does not exist', () => {
      it('returns a 404', async () => {
        const siteId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/site/${siteId}/user-environment-variable`)
          .set('Cookie', cookie)
          .type('json')
          .expect(404);

        validateAgainstJSONSchema('GET', '/site/{site_id}/user-environment-variable', 404, body);
      });
    });

    describe('when the user is not authorized to see the site', () => {
      it('returns a 404', async () => {
        const site = await factory.site();
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/site/${site.id}/user-environment-variable`)
          .set('Cookie', cookie)
          .type('json')
          .expect(404);

        validateAgainstJSONSchema('GET', '/site/{site_id}/user-environment-variable', 404, body);
      });
    });

    describe('when there are no user environment variables for the site', () => {
      it('returns an empty array', async () => {
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const user = await userPromise;
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/site/${site.id}/user-environment-variable`)
          .set('Cookie', cookie)
          .type('json')
          .expect(200);

        validateAgainstJSONSchema('GET', '/site/{site_id}/user-environment-variable', 200, body);

        expect(body).to.be.empty;
      });
    });

    describe('when there are user environment variables for the site', () => {
      it('returns an array containing only the uevs for the site', async () => {
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const uevs = await Promise.all([
          await factory.userEnvironmentVariable.create({ site }),
          await factory.userEnvironmentVariable.create({ site }),
        ]);
        await Promise.all([
          // Different user and site
          await factory.userEnvironmentVariable.create(),
          // Same user, different site
          await factory.userEnvironmentVariable.create({
            site: await factory.site({ users: Promise.all([userPromise]) }),
          }),
        ]);

        const user = await userPromise;
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/site/${site.id}/user-environment-variable`)
          .set('Cookie', cookie)
          .type('json')
          .expect(200);

        validateAgainstJSONSchema('GET', '/site/{site_id}/user-environment-variable', 200, body);

        expect(body).to.have.length(uevs.length);
        expect(body.map(uev => uev.id)).to.have.members(uevs.map(uev => uev.id));
      });
    });
  });

  describe('POST /v0/site/:site_id/user-environment-variable', () => {
  });
});
