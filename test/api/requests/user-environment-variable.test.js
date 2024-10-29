const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const factory = require('../support/factory');
const csrfToken = require('../support/csrfToken');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const app = require('../../../app');
const config = require('../../../config');
const { Role, UserEnvironmentVariable } = require('../../../api/models');
const EventCreator = require('../../../api/services/EventCreator');

describe('User Environment Variable API', () => {
  beforeEach(() => {
    sinon.stub(EventCreator, 'error').resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('DELETE /v0/site/:site_id/user-environment-variable/:uev_id', () => {
    describe('when the user is not authenticated', () => {
      it('returns a 403', async () => {
        const siteId = 1;
        const uevId = 1;

        const { body } = await request(app)
          .delete(`/v0/site/${siteId}/user-environment-variable/${uevId}`)
          .expect(403);

        validateAgainstJSONSchema(
          'DELETE',
          '/site/{site_id}/user-environment-variable/{user-environment-variable_id}',
          403,
          body,
        );
      });
    });

    describe('when the site does not exist', () => {
      it('returns a 404', async () => {
        const siteId = 1;
        const uevId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .delete(`/v0/site/${siteId}/user-environment-variable/${uevId}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema(
          'DELETE',
          '/site/{site_id}/user-environment-variable/{user-environment-variable_id}',
          404,
          body,
        );
      });
    });

    describe('when the user is not authorized to see the site', () => {
      it('returns a 404', async () => {
        const uevId = 1;
        const [site, user] = await Promise.all([factory.site(), factory.user()]);
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .delete(`/v0/site/${site.id}/user-environment-variable/${uevId}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema(
          'DELETE',
          '/site/{site_id}/user-environment-variable/{user-environment-variable_id}',
          404,
          body,
        );
      });
    });

    describe('when the user environment variable does not exist', () => {
      it('returns a 404', async () => {
        const uevId = 1;
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .delete(`/v0/site/${site.id}/user-environment-variable/${uevId}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema(
          'DELETE',
          '/site/{site_id}/user-environment-variable/{user-environment-variable_id}',
          404,
          body,
        );
      });
    });

    describe('when the parameters are valid', () => {
      it('deletes the uev and returns a 200', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const [uev, user] = await Promise.all([
          factory.userEnvironmentVariable.create({ site }),
          userPromise,
        ]);
        const cookie = await authenticatedSession(user);

        const beforeNumUEVs = await UserEnvironmentVariable.count();

        await request(app)
          .delete(`/v0/site/${site.id}/user-environment-variable/${uev.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(200);

        const afterNumUEVs = await UserEnvironmentVariable.count();
        expect(afterNumUEVs).to.eq(beforeNumUEVs - 1);
      });

      it('allows an org user to delete the uev and returns a 200', async () => {
        const org = await factory.organization.create();
        const role = await Role.findOne({
          where: {
            name: 'user',
          },
        });
        const user = await factory.user();
        const site = await factory.site();
        await org.addUser(user, {
          through: {
            roleId: role.id,
          },
        });
        await org.addSite(site);

        const uevs = await Promise.all([
          factory.userEnvironmentVariable.create({
            site,
            name: 'foo',
          }),
          factory.userEnvironmentVariable.create({
            site,
            name: 'bar',
          }),
        ]);

        const cookie = await authenticatedSession(user);

        const beforeNumUEVs = await UserEnvironmentVariable.count();

        await request(app)
          .delete(`/v0/site/${site.id}/user-environment-variable/${uevs[0].id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(200);

        const afterNumUEVs = await UserEnvironmentVariable.count();
        expect(afterNumUEVs).to.eq(beforeNumUEVs - 1);
      });
    });
  });

  describe('GET /v0/site/:site_id/user-environment-variable', () => {
    describe('when the user is not authenticated', () => {
      it('returns a 403', async () => {
        const siteId = 1;

        const { body } = await request(app)
          .get(`/v0/site/${siteId}/user-environment-variable`)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema(
          'GET',
          '/site/{site_id}/user-environment-variable',
          403,
          body,
        );
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

        validateAgainstJSONSchema(
          'GET',
          '/site/{site_id}/user-environment-variable',
          404,
          body,
        );
      });
    });

    describe('when the user is not authorized to see the site', () => {
      it('returns a 404', async () => {
        const [site, user] = await Promise.all([factory.site(), factory.user()]);
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/site/${site.id}/user-environment-variable`)
          .set('Cookie', cookie)
          .type('json')
          .expect(404);

        validateAgainstJSONSchema(
          'GET',
          '/site/{site_id}/user-environment-variable',
          404,
          body,
        );
      });
    });

    describe('when there are no user environment variables for the site', () => {
      it('returns an empty array', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/site/${site.id}/user-environment-variable`)
          .set('Cookie', cookie)
          .type('json')
          .expect(200);

        validateAgainstJSONSchema(
          'GET',
          '/site/{site_id}/user-environment-variable',
          200,
          body,
        );
        expect(body).to.be.empty;
      });
    });

    describe('when there are user environment variables for the site', () => {
      it('returns an array containing only the uevs for the site', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const uevs = await Promise.all([
          factory.userEnvironmentVariable.create({
            site,
            name: 'foo',
          }),
          factory.userEnvironmentVariable.create({
            site,
            name: 'bar',
          }),
        ]);
        await Promise.all([
          // Different user and site
          factory.userEnvironmentVariable.create(),
          // Same user, different site
          factory.userEnvironmentVariable.create({
            site: await factory.site({
              users: Promise.all([userPromise]),
            }),
          }),
        ]);

        const user = await userPromise;
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/site/${site.id}/user-environment-variable`)
          .set('Cookie', cookie)
          .type('json')
          .expect(200);

        validateAgainstJSONSchema(
          'GET',
          '/site/{site_id}/user-environment-variable',
          200,
          body,
        );
        expect(body).to.have.length(uevs.length);
        expect(body.map((uev) => uev.id)).to.have.members(uevs.map((uev) => uev.id));
      });

      it(`returns an array containing only the uevs for a site
          for an org user in the site org`, async () => {
        const org = await factory.organization.create();
        const role = await Role.findOne({
          where: {
            name: 'user',
          },
        });
        const user = await factory.user();
        const site = await factory.site();
        await org.addUser(user, {
          through: {
            roleId: role.id,
          },
        });
        await org.addSite(site);

        const uevs = await Promise.all([
          factory.userEnvironmentVariable.create({
            site,
            name: 'foo',
          }),
          factory.userEnvironmentVariable.create({
            site,
            name: 'bar',
          }),
        ]);

        await Promise.all([
          // Different user and site
          factory.userEnvironmentVariable.create(),
          // Same user, different site
          factory.userEnvironmentVariable.create({
            site: await factory.site({
              users: Promise.all([user]),
            }),
          }),
        ]);

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/site/${site.id}/user-environment-variable`)
          .set('Cookie', cookie)
          .type('json')
          .expect(200);

        validateAgainstJSONSchema(
          'GET',
          '/site/{site_id}/user-environment-variable',
          200,
          body,
        );
        expect(body).to.have.length(uevs.length);
        expect(body.map((uev) => uev.id)).to.have.members(uevs.map((uev) => uev.id));
      });
    });
  });

  describe('POST /v0/site/:site_id/user-environment-variable', () => {
    describe('when the user is not authenticated', () => {
      it('returns a 403', async () => {
        const siteId = 1;

        const { body } = await request(app)
          .post(`/v0/site/${siteId}/user-environment-variable`)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema(
          'POST',
          '/site/{site_id}/user-environment-variable',
          403,
          body,
        );
      });
    });

    describe('when there is no csrf token', () => {
      it('returns a 403', async () => {
        const siteId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${siteId}/user-environment-variable`)
          .set('Cookie', cookie)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema(
          'POST',
          '/site/{site_id}/user-environment-variable',
          403,
          body,
        );
      });
    });

    describe('when the site does not exist', () => {
      it('returns a 404', async () => {
        const siteId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${siteId}/user-environment-variable`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema(
          'POST',
          '/site/{site_id}/user-environment-variable',
          404,
          body,
        );
      });
    });

    describe('when the user is not authorized to see the site', () => {
      it('returns a 404', async () => {
        const [site, user] = await Promise.all([factory.site(), factory.user()]);
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/user-environment-variable`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema(
          'POST',
          '/site/{site_id}/user-environment-variable',
          404,
          body,
        );
      });
    });

    describe('when the parameters are not valid', () => {
      it('returns a 400', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/user-environment-variable`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({})
          .expect(400);

        validateAgainstJSONSchema(
          'POST',
          '/site/{site_id}/user-environment-variable',
          400,
          body,
        );
      });
    });

    describe('when the name already exists', () => {
      it('returns a 400', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const name = 'my-env-var';
        await factory.userEnvironmentVariable.create({
          name,
          value: 'secret1234',
          site,
        });
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/user-environment-variable`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            name,
            value: 'foobar',
          })
          .expect(400);

        validateAgainstJSONSchema(
          'POST',
          '/site/{site_id}/user-environment-variable',
          400,
          body,
        );
        expect(body.message).to.eq(
          // eslint-disable-next-line max-len
          `A user environment variable with name: "${name}" already exists for this site.`,
        );
      });
    });

    describe('when something unexpected happens', () => {
      let origConfigVal;

      beforeEach(() => {
        origConfigVal = config.userEnvVar.key;
        config.userEnvVar.key = null;
      });

      afterEach(() => {
        config.userEnvVar.key = origConfigVal;
      });

      it('cannot encrypt without key and returns a 500', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const cookie = await authenticatedSession(user);
        const name = 'my-env-var';
        const value = 'secret1234';

        await request(app)
          .post(`/v0/site/${site.id}/user-environment-variable`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            name,
            value,
          })
          .expect(500);
      });
    });

    describe('when the parameters are valid', () => {
      it('creates and returns the uev', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const cookie = await authenticatedSession(user);
        const name = 'my-env-var';
        const value = 'secret1234';

        const beforeNumUEVs = await UserEnvironmentVariable.count();

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/user-environment-variable`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            name,
            value,
          })
          .expect(200);

        const afterNumUEVs = await UserEnvironmentVariable.count();

        validateAgainstJSONSchema(
          'POST',
          '/site/{site_id}/user-environment-variable',
          200,
          body,
        );
        expect(body.name).to.eq(name);
        expect(body.hint).to.eq('');
        expect(afterNumUEVs).to.eq(beforeNumUEVs + 1);
      });

      it('allows an org user to create and return the uev', async () => {
        const org = await factory.organization.create();
        const role = await Role.findOne({
          where: {
            name: 'user',
          },
        });
        const user = await factory.user();
        const site = await factory.site();
        await org.addUser(user, {
          through: {
            roleId: role.id,
          },
        });
        await org.addSite(site);

        const cookie = await authenticatedSession(user);
        const name = 'my-env-var';
        const value = 'secret1234';

        const beforeNumUEVs = await UserEnvironmentVariable.count();

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/user-environment-variable`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            name,
            value,
          })
          .expect(200);

        const afterNumUEVs = await UserEnvironmentVariable.count();

        validateAgainstJSONSchema(
          'POST',
          '/site/{site_id}/user-environment-variable',
          200,
          body,
        );
        expect(body.name).to.eq(name);
        expect(body.hint).to.eq('');
        expect(afterNumUEVs).to.eq(beforeNumUEVs + 1);
      });
    });
  });
});
