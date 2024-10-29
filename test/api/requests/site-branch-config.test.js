const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const yaml = require('js-yaml');
const factory = require('../support/factory');
const csrfToken = require('../support/csrfToken');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const app = require('../../../app');
const { Build, Role, Site, SiteBranchConfig } = require('../../../api/models');
const EventCreator = require('../../../api/services/EventCreator');

function clean() {
  return Promise.all([
    SiteBranchConfig.truncate({
      force: true,
      cascade: true,
    }),
    Site.truncate({
      force: true,
      cascade: true,
    }),
    Build.truncate({
      force: true,
      cascade: true,
    }),
  ]);
}

describe('Site Branch Config API', () => {
  beforeEach(async () => {
    sinon.stub(EventCreator, 'error').resolves();
    await clean();
  });

  afterEach(async () => {
    sinon.restore();
    await clean();
  });

  describe('DELETE /v0/site/:site_id/branch-config/:id', () => {
    describe('when the user is not authenticated', () => {
      it('returns a 403', async () => {
        const siteId = 1;
        const branchConfigId = 1;

        const { body } = await request(app)
          .delete(`/v0/site/${siteId}/branch-config/${branchConfigId}`)
          .expect(403);

        validateAgainstJSONSchema(
          'DELETE',
          '/site/{site_id}/branch-config/{site-branch-config_id}',
          403,
          body,
        );
      });
    });

    describe('when the site does not exist', () => {
      it('returns a 404', async () => {
        const siteId = 1;
        const branchConfigId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .delete(`/v0/site/${siteId}/branch-config/${branchConfigId}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema(
          'DELETE',
          '/site/{site_id}/branch-config/{site-branch-config_id}',
          404,
          body,
        );
      });
    });

    describe('when the user is not authorized to see the site', () => {
      it('returns a 404', async () => {
        const branchConfigId = 1;
        const [site, user] = await Promise.all([factory.site(), factory.user()]);
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .delete(`/v0/site/${site.id}/branch-config/${branchConfigId}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema(
          'DELETE',
          '/site/{site_id}/branch-config/{site-branch-config_id}',
          404,
          body,
        );
      });
    });

    describe('when the site branch config does not exist', () => {
      it('returns a 404', async () => {
        const branchConfigId = 1;
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .delete(`/v0/site/${site.id}/branch-config/${branchConfigId}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema(
          'DELETE',
          '/site/{site_id}/branch-config/{site-branch-config_id}',
          404,
          body,
        );
      });
    });

    describe('when the parameters are valid', () => {
      it('deletes the site branch config and returns a 200', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const [sbc, user] = await Promise.all([
          factory.siteBranchConfig.create({ site }),
          userPromise,
        ]);
        const cookie = await authenticatedSession(user);

        const beforeNumSBC = await SiteBranchConfig.count();

        await request(app)
          .delete(`/v0/site/${site.id}/branch-config/${sbc.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(200);

        const afterNumSBC = await SiteBranchConfig.count();
        expect(afterNumSBC).to.eq(beforeNumSBC - 1);
      });

      it(`allows an org user to delete the
          site branch config and returns a 200`, async () => {
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

        const sbcs = await Promise.all([
          factory.siteBranchConfig.create({
            site,
            branch: 'test1',
          }),
          factory.siteBranchConfig.create({
            site,
            branch: 'test2',
          }),
        ]);

        const cookie = await authenticatedSession(user);

        const beforeNumSBCs = await SiteBranchConfig.count();

        await request(app)
          .delete(`/v0/site/${site.id}/branch-config/${sbcs[0].id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(200);

        const afterNumSBC = await SiteBranchConfig.count();
        expect(afterNumSBC).to.eq(beforeNumSBCs - 1);
      });
    });
  });

  describe('GET /v0/site/:site_id/branch-config', () => {
    describe('when the user is not authenticated', () => {
      it('returns a 403', async () => {
        const siteId = 1;

        const { body } = await request(app)
          .get(`/v0/site/${siteId}/branch-config`)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema('GET', '/site/{site_id}/branch-config', 403, body);
      });
    });

    describe('when the site does not exist', () => {
      it('returns a 404', async () => {
        const siteId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/site/${siteId}/branch-config`)
          .set('Cookie', cookie)
          .type('json')
          .expect(404);

        validateAgainstJSONSchema('GET', '/site/{site_id}/branch-config', 404, body);
      });
    });

    describe('when the user is not authorized to see the site', () => {
      it('returns a 404', async () => {
        const [site, user] = await Promise.all([factory.site(), factory.user()]);
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .type('json')
          .expect(404);

        validateAgainstJSONSchema('GET', '/site/{site_id}/branch-config', 404, body);
      });
    });

    describe('when there are no site branch configs for the site', () => {
      it('returns an empty array', async () => {
        const userPromise = factory.user();
        const site = await factory.site(
          {
            users: Promise.all([userPromise]),
          },
          {
            noSiteBranchConfig: true,
          },
        );
        const user = await userPromise;
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .type('json')
          .expect(200);

        validateAgainstJSONSchema('GET', '/site/{site_id}/branch-config', 200, body);
        expect(body).to.be.empty;
      });
    });

    describe('when there are site branch configs for the site', () => {
      it(`returns an array containing only
          the site branch configs for the site`, async () => {
        const userPromise = factory.user();
        const site = await factory.site(
          {
            users: Promise.all([userPromise]),
          },
          {
            noSiteBranchConfig: true,
          },
        );
        const otherSite = await factory.site(
          {
            users: Promise.all([userPromise]),
          },
          {
            noSiteBranchConfig: true,
          },
        );
        const sbcs = await Promise.all([
          factory.siteBranchConfig.create({
            site,
            branch: 'test1',
          }),
          factory.siteBranchConfig.create({
            site,
            branch: 'test2',
          }),
          factory.siteBranchConfig.create({
            site,
            branch: 'test3',
          }),
          factory.siteBranchConfig.create({
            site,
            branch: 'test4',
          }),
        ]);
        await Promise.all([
          factory.siteBranchConfig.create({
            otherSite,
            branch: 'test1',
          }),
          factory.siteBranchConfig.create({
            otherSite,
            branch: 'test2',
          }),
          factory.siteBranchConfig.create({
            otherSite,
            branch: 'test3',
          }),
          factory.siteBranchConfig.create({
            otherSite,
            branch: 'test4',
          }),
        ]);

        const user = await userPromise;
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .type('json')
          .expect(200);

        validateAgainstJSONSchema('GET', '/site/{site_id}/branch-config', 200, body);
        expect(body).to.have.length(sbcs.length);
        expect(body.map((sbc) => sbc.id)).to.have.members(sbcs.map((sbc) => sbc.id));
      });

      it(`returns an array containing only the site branch configs
          for a site for an org user in the site org`, async () => {
        const org = await factory.organization.create();
        const role = await Role.findOne({
          where: {
            name: 'user',
          },
        });
        const user = await factory.user();
        const site = await factory.site(undefined, {
          noSiteBranchConfig: true,
        });
        await org.addUser(user, {
          through: {
            roleId: role.id,
          },
        });
        await org.addSite(site);

        const sbcs = await Promise.all([
          factory.siteBranchConfig.create({
            site,
            branch: 'test1',
          }),
          factory.siteBranchConfig.create({
            site,
            branch: 'test2',
          }),
          factory.siteBranchConfig.create({
            site,
            branch: 'test3',
          }),
          factory.siteBranchConfig.create({
            site,
            branch: 'test4',
          }),
        ]);

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .type('json')
          .expect(200);

        validateAgainstJSONSchema('GET', '/site/{site_id}/branch-config', 200, body);
        expect(body).to.have.length(sbcs.length);
        expect(body.map((sbc) => sbc.id)).to.have.members(sbcs.map((sbc) => sbc.id));
      });
    });
  });

  describe('POST /v0/site/:site_id/branch-config', () => {
    describe('when the user is not authenticated', () => {
      it('returns a 403', async () => {
        const siteId = 1;

        const { body } = await request(app)
          .post(`/v0/site/${siteId}/branch-config`)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 403, body);
      });
    });

    describe('when there is no csrf token', () => {
      it('returns a 403', async () => {
        const siteId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${siteId}/branch-config`)
          .set('Cookie', cookie)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 403, body);
      });
    });

    describe('when the site does not exist', () => {
      it('returns a 404', async () => {
        const siteId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${siteId}/branch-config`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 404, body);
      });
    });

    describe('when the user is not authorized to see the site', () => {
      it('returns a 404', async () => {
        const [site, user] = await Promise.all([factory.site(), factory.user()]);
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 404, body);
      });
    });

    describe('when the branch already exists for a site', () => {
      it('returns a 400', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const branch = 'test1';
        const context = 'preview';
        await factory.siteBranchConfig.create({ site, branch });
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            branch,
            context,
          })
          .expect(400);

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 400, body);
        expect(body.message).to.eq(
          // eslint-disable-next-line max-len
          'An error occurred creating the site branch config: Branch names must be unique per site.',
        );
      });
    });

    describe('when the branch name is invalid', () => {
      it('returns a 400', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const branch = 'test bad branch name$';
        const cookie = await authenticatedSession(user);
        const context = 'preview';

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            branch,
            context,
          })
          .expect(400);

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 400, body);
        expect(body.message).to.eq(
          // eslint-disable-next-line max-len
          'An error occurred creating the site branch config: Validation error: Invalid branch name — branches can only contain alphanumeric characters, underscores, and hyphens.',
        );
      });

      it('returns a 400 when branch name is too long', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const branch = Array(301).join('b');
        const cookie = await authenticatedSession(user);
        const context = 'preview';

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            branch,
            context,
          })
          .expect(400);

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 400, body);
        expect(body.message).to.eq(
          // eslint-disable-next-line max-len
          'An error occurred creating the site branch config: Validation error: Invalid branch name — branch names are limitted to 299 characters.',
        );
      });
    });

    describe('when the config is not valid', () => {
      it('returns a 400 with a number as a config', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const branch = 'test1';
        const config = '12345';
        const context = 'preview';
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            branch,
            config,
            context,
          })
          .expect(400);

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 400, body);
        expect(body.message).to.eq(
          // eslint-disable-next-line max-len
          'An error occurred creating the site branch config: Config must be valid JSON or YAML.',
        );
      });

      it('returns a 400 with a string as a config', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const branch = 'test1';
        const config = 'tests';
        const context = 'preview';
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            branch,
            config,
            context,
          })
          .expect(400);

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 400, body);
        expect(body.message).to.eq(
          // eslint-disable-next-line max-len
          'An error occurred creating the site branch config: Config must be valid JSON or YAML.',
        );
      });
    });

    describe('when the context is invalid', () => {
      it('returns a 400', async () => {
        const userPromise = factory.user();
        const site = await factory.site(
          {
            users: Promise.all([userPromise]),
          },
          {
            noSiteBranchConfig: true,
          },
        );
        const user = await userPromise;
        const branch = 'test bad branch name$';
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            branch,
            context: 123,
          })
          .expect(400);

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 400, body);
        expect(body.message).to.eq(
          // eslint-disable-next-line max-len
          'An error occurred creating the site branch config: Context must be a valid string.',
        );
      });
    });

    describe('when the parameters are valid', () => {
      it('creates and returns the site branch config', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const cookie = await authenticatedSession(user);
        const branch = 'my-test-branch';
        const config = {
          hello: 'world',
        };
        const context = 'preview';

        const beforeNumSBCs = await SiteBranchConfig.count();

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            branch,
            config,
            context,
          })
          .expect(200);

        const afterNumSBC = await SiteBranchConfig.count();

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 200, body);
        expect(body.branch).to.eq(branch);
        expect(body.config).to.deep.eq(config);
        expect(body.s3Key).to.be.null;
        expect(afterNumSBC).to.eq(beforeNumSBCs + 1);
      });

      it('creates s3key for site context', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const cookie = await authenticatedSession(user);
        const branch = 'my-test-branch';
        const config = {
          hello: 'world',
        };
        const context = 'site';

        const beforeNumSBCs = await SiteBranchConfig.count();

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            branch,
            config,
            context,
          })
          .expect(200);

        const afterNumSBC = await SiteBranchConfig.count();
        const build = await Build.findOne({
          siteId: site.id,
        });

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 200, body);
        expect(body.branch).to.eq(branch);
        expect(body.config).to.deep.eq(config);
        expect(body.s3Key).to.eq(`/site/${site.owner}/${site.repository}`);
        expect(build.branch).to.eq(branch);
        expect(afterNumSBC).to.eq(beforeNumSBCs + 1);
      });

      it('creates s3Key for demo context and kicks off a build', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const cookie = await authenticatedSession(user);
        const branch = 'my-test-branch';
        const config = {
          hello: 'world',
        };
        const context = 'demo';

        const beforeNumSBCs = await SiteBranchConfig.count();

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            branch,
            config,
            context,
          })
          .expect(200);

        const afterNumSBC = await SiteBranchConfig.count();
        const build = await Build.findOne({
          siteId: site.id,
        });

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 200, body);
        expect(body.branch).to.eq(branch);
        expect(body.config).to.deep.eq(config);
        expect(body.s3Key).to.eq(`/demo/${site.owner}/${site.repository}`);
        expect(build.branch).to.eq(branch);
        expect(afterNumSBC).to.eq(beforeNumSBCs + 1);
      });

      it('creates s3Key for other context type', async () => {
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const user = await userPromise;
        const cookie = await authenticatedSession(user);
        const branch = 'my-test-branch';
        const config = {
          hello: 'world',
        };
        const context = 'other';

        const beforeNumSBCs = await SiteBranchConfig.count();

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            branch,
            config,
            context,
          })
          .expect(200);

        const afterNumSBC = await SiteBranchConfig.count();
        const build = await Build.findOne({
          siteId: site.id,
        });

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 200, body);
        expect(body.branch).to.eq(branch);
        expect(body.config).to.deep.eq(config);
        expect(body.s3Key).to.eq(`preview/${site.owner}/${site.repository}/${branch}`);
        expect(build.branch).to.eq(branch);
        expect(afterNumSBC).to.eq(beforeNumSBCs + 1);
      });

      it('creates and returns the preview site branch config', async () => {
        const userPromise = factory.user();
        const site = await factory.site(
          {
            users: Promise.all([userPromise]),
          },
          {
            noSiteBranchConfig: true,
          },
        );
        const user = await userPromise;
        const cookie = await authenticatedSession(user);
        const context = 'preview';
        const config = {
          hello: 'world',
        };

        const beforeNumSBCs = await SiteBranchConfig.count();

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            context,
            config,
          })
          .expect(200);

        const afterNumSBC = await SiteBranchConfig.count();
        const build = await Build.findOne({
          siteId: site.id,
        });

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 200, body);
        expect(body.context).to.eq(context);
        expect(body.config).to.deep.eq(config);
        expect(build).to.eq(null);
        expect(afterNumSBC).to.eq(beforeNumSBCs + 1);
      });

      it('allows an org user to create and return the site branch config', async () => {
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
        const branch = 'my-test-branch';
        const config = {
          hello: 'world',
        };

        const beforeNumSBCs = await SiteBranchConfig.count();

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/branch-config`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            branch,
            config,
          })
          .expect(200);

        const afterNumSBC = await SiteBranchConfig.count();

        validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 200, body);
        expect(body.branch).to.eq(branch);
        expect(body.config).to.deep.eq(config);
        expect(afterNumSBC).to.eq(beforeNumSBCs + 1);
      });
    });

    it('creates and returns the site branch config with a yaml config', async () => {
      const userPromise = factory.user();
      const site = await factory.site({
        users: Promise.all([userPromise]),
      });
      const user = await userPromise;
      const cookie = await authenticatedSession(user);
      const branch = 'my-test-branch';
      const configObject = {
        hello: 'world',
      };
      const config = yaml.dump(configObject);
      const context = 'preview';

      const beforeNumSBCs = await SiteBranchConfig.count();

      const { body } = await request(app)
        .post(`/v0/site/${site.id}/branch-config`)
        .set('Cookie', cookie)
        .set('x-csrf-token', csrfToken.getToken())
        .type('json')
        .send({
          branch,
          config,
          context,
        })
        .expect(200);

      const afterNumSBC = await SiteBranchConfig.count();

      validateAgainstJSONSchema('POST', '/site/{site_id}/branch-config', 200, body);
      expect(body.branch).to.eq(branch);
      expect(body.config).to.deep.eq(configObject);
      expect(afterNumSBC).to.eq(beforeNumSBCs + 1);
    });
  });

  describe('PUT /v0/site/:site_id/branch-config/:id', () => {
    describe('when updating a site branch config', () => {
      it('updates site branch config', async () => {
        const origBranch = 'updated-test-branch';
        const origConfig = {
          hello: 'world',
        };
        const updatedBranch = 'updated-test-branch';
        const updatedConfig = { hello: 'again' };
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const sbc = await factory.siteBranchConfig.create({
          site,
          branch: origBranch,
          config: origConfig,
        });
        const user = await userPromise;
        const cookie = await authenticatedSession(user);

        const beforeNumSBCs = await SiteBranchConfig.count();

        const { body } = await request(app)
          .put(`/v0/site/${site.id}/branch-config/${sbc.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            branch: updatedBranch,
            config: updatedConfig,
          })
          .expect(200);

        const afterNumSBC = await SiteBranchConfig.count();

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/branch-config/{site-branch-config_id}',
          200,
          body,
        );
        expect(body.branch).to.eq(updatedBranch);
        expect(body.config).to.deep.eq(updatedConfig);
        expect(afterNumSBC).to.eq(beforeNumSBCs);
      });

      it(`updates the site branch config and
          kicks off a build when not a preview context`, async () => {
        const branch = 'test';
        const context = 'site';
        const origConfig = {
          hello: 'world',
        };
        const updatedConfig = { hello: 'again' };
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        const sbc = await factory.siteBranchConfig.create({
          site,
          branch,
          context,
          config: origConfig,
        });
        const user = await userPromise;
        const cookie = await authenticatedSession(user);

        const beforeNumSBCs = await SiteBranchConfig.count();

        const { body } = await request(app)
          .put(`/v0/site/${site.id}/branch-config/${sbc.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            branch,
            config: updatedConfig,
            context,
          })
          .expect(200);

        const afterNumSBC = await SiteBranchConfig.count();
        const build = await Build.findOne({
          siteId: site.id,
        });

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/branch-config/{site-branch-config_id}',
          200,
          body,
        );
        expect(body.branch).to.eq(branch);
        expect(body.config).to.deep.eq(updatedConfig);
        expect(build.branch).to.equal(branch);
        expect(afterNumSBC).to.eq(beforeNumSBCs);
      });

      it(`updates the site branch config config and
          does not kicks off a build when a preview context`, async () => {
        const context = 'preview';
        const origConfig = {
          hello: 'world',
        };
        const updatedConfig = { hello: 'again' };
        const userPromise = factory.user();
        const site = await factory.site(
          {
            users: Promise.all([userPromise]),
          },
          {
            noSiteBranchConfig: true,
          },
        );
        const sbc = await factory.siteBranchConfig.create({
          site,
          context,
          config: origConfig,
        });
        const user = await userPromise;
        const cookie = await authenticatedSession(user);

        const beforeNumSBCs = await SiteBranchConfig.count();

        const { body } = await request(app)
          .put(`/v0/site/${site.id}/branch-config/${sbc.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            config: updatedConfig,
            context,
          })
          .expect(200);

        const afterNumSBC = await SiteBranchConfig.count();
        const build = await Build.findOne({
          siteId: site.id,
        });

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/branch-config/{site-branch-config_id}',
          200,
          body,
        );
        expect(body.context).to.eq(context);
        expect(body.config).to.deep.eq(updatedConfig);
        expect(build).to.equal(null);
        expect(afterNumSBC).to.eq(beforeNumSBCs);
      });

      it('returns the 404 if does not exist', async () => {
        const origBranch = 'updated-test-branch';
        const origConfig = {
          hello: 'world',
        };
        const updatedBranch = 'updated-test-branch';
        const updatedConfig = { hello: 'again' };
        const userPromise = factory.user();
        const site = await factory.site({
          users: Promise.all([userPromise]),
        });
        await factory.siteBranchConfig.create({
          site,
          branch: origBranch,
          config: origConfig,
          context: 'preview',
        });
        const notSBC = 90210;
        const user = await userPromise;
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .put(`/v0/site/${site.id}/branch-config/${notSBC}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            branch: updatedBranch,
            config: updatedConfig,
          })
          .expect(404);

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/branch-config/{site-branch-config_id}',
          404,
          body,
        );
      });
    });
  });
});
