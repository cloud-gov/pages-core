const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const yaml = require('js-yaml');
const factory = require('../support/factory');
const csrfToken = require('../support/csrfToken');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const app = require('../../../app');
const { Domain, Role, Site, SiteBranchConfig } = require('../../../api/models');
const EventCreator = require('../../../api/services/EventCreator');

function clean() {
  return Promise.all([
    SiteBranchConfig.truncate({ force: true, cascade: true }),
    Site.truncate({ force: true, cascade: true }),
    Domain.truncate({ force: true, cascade: true }),
  ]);
}

describe('Domain API', () => {
  beforeEach(async () => {
    sinon.stub(EventCreator, 'error').resolves();
    await clean();
  });

  afterEach(async () => {
    sinon.restore();
    await clean();
  });

  describe('DELETE /v0/site/:site_id/domain/:domain_id', () => {
    describe('when the user is not authenticated', () => {
      it('returns a 403', async () => {
        const siteId = 1;
        const domainId = 1;

        const { body } = await request(app)
          .delete(`/v0/site/${siteId}/domain/${domainId}`)
          .expect(403);

        validateAgainstJSONSchema(
          'DELETE',
          '/site/{site_id}/domain/{domain_id}',
          403,
          body
        );
      });
    });

    describe('when the site does not exist', () => {
      it('returns a 404', async () => {
        const siteId = 1;
        const domainId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .delete(`/v0/site/${siteId}/domain/${domainId}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema(
          'DELETE',
          '/site/{site_id}/domain/{domain_id}',
          404,
          body
        );
      });
    });

    describe('when the user is not authorized to see the site', () => {
      it('returns a 404', async () => {
        const domainId = 1;
        const [site, user] = await Promise.all([
          factory.site(),
          factory.user(),
        ]);
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .delete(`/v0/site/${site.id}/domain/${domainId}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema(
          'DELETE',
          '/site/{site_id}/domain/{domain_id}',
          404,
          body
        );
      });
    });

    describe('when the domain does not exist', () => {
      it('returns a 404', async () => {
        const domainId = 1;
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const user = await userPromise;
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .delete(`/v0/site/${site.id}/domain/${domainId}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema(
          'DELETE',
          '/site/{site_id}/domain/{domain_id}',
          404,
          body
        );
      });
    });

    describe('when the parameters are valid', () => {
      it('deletes the domain when it is in a pending state', async () => {
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const [user] = await Promise.all([userPromise]);
        const domain = await factory.domain.create({
          siteId: site.id,
          siteBranchConfigId: site.SiteBranchConfigs[0].id,
          state: 'pending',
        });
        const cookie = await authenticatedSession(user);

        const beforeNumSBC = await Domain.count();

        await request(app)
          .delete(`/v0/site/${site.id}/domain/${domain.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(200);

        const afterNumSBC = await Domain.count();
        expect(afterNumSBC).to.eq(beforeNumSBC - 1);
      });

      it('allows an org user to delete the domain in a pending state', async () => {
        const org = await factory.organization.create();
        const role = await Role.findOne({ where: { name: 'user' } });
        const user = await factory.user();
        const site = await factory.site();
        await org.addUser(user, { through: { roleId: role.id } });
        await org.addSite(site);

        const domain = await factory.domain.create({
          siteId: site.id,
          siteBranchConfigId: site.SiteBranchConfigs[0].id,
          state: 'pending',
        });

        const cookie = await authenticatedSession(user);

        const beforeCount = await Domain.count();

        await request(app)
          .delete(`/v0/site/${site.id}/domain/${domain.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(200);

        const afterCount = await Domain.count();
        expect(afterCount).to.eq(beforeCount - 1);
      });

      it('does not allow a user to delete the domain when not in a pending state', async () => {
        const org = await factory.organization.create();
        const role = await Role.findOne({ where: { name: 'user' } });
        const user = await factory.user();
        const site = await factory.site();
        await org.addUser(user, { through: { roleId: role.id } });
        await org.addSite(site);

        const domain = await factory.domain.create({
          siteId: site.id,
          siteBranchConfigId: site.SiteBranchConfigs[0].id,
          state: 'provisioned',
        });

        const cookie = await authenticatedSession(user);

        const beforeCount = await Domain.count();

        await request(app)
          .delete(`/v0/site/${site.id}/domain/${domain.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(400);

        const afterCount = await Domain.count();
        expect(afterCount).to.eq(beforeCount);
      });
    });
  });

  describe('POST /v0/site/:site_id/domain', () => {
    describe('when the user is not authenticated', () => {
      it('returns a 403', async () => {
        const siteId = 1;

        const { body } = await request(app)
          .post(`/v0/site/${siteId}/domain`)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema('POST', '/site/{site_id}/domain', 403, body);
      });
    });

    describe('when there is no csrf token', () => {
      it('returns a 403', async () => {
        const siteId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${siteId}/domain`)
          .set('Cookie', cookie)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema('POST', '/site/{site_id}/domain', 403, body);
      });
    });

    describe('when the site does not exist', () => {
      it('returns a 404', async () => {
        const siteId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${siteId}/domain`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema('POST', '/site/{site_id}/domain', 404, body);
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
          .post(`/v0/site/${site.id}/domain`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema('POST', '/site/{site_id}/domain', 404, body);
      });
    });

    describe('when the name already exists for a site domain', () => {
      it('returns a 400', async () => {
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const user = await userPromise;
        const branch = 'demo';
        const context = 'demo';
        const names = 'www.agency.gov';
        const sbc2 = await factory.siteBranchConfig.create({
          site,
          branch,
          context,
        });

        await factory.domain.create({
          siteId: site.id,
          siteBranchConfigId: site.SiteBranchConfigs[0].id,
          state: 'provisioned',
          names,
        });

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/domain`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({ siteBranchConfigId: sbc2.id, names })
          .expect(400);

        validateAgainstJSONSchema('POST', '/site/{site_id}/domain', 400, body);
        expect(body.message).to.eq(
          'A domain with the same name already exists for the site.'
        );
      });
    });

    describe('when the branch config already exists for a site domain', () => {
      it('returns a 400', async () => {
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const user = await userPromise;
        const names1 = 'www.agency.gov';
        const names2 = 'demo.agency.gov';

        await factory.domain.create({
          siteId: site.id,
          siteBranchConfigId: site.SiteBranchConfigs[0].id,
          state: 'provisioned',
          names: names1,
        });

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/domain`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            siteBranchConfigId: site.SiteBranchConfigs[0].id,
            names: names2,
          })
          .expect(400);

        validateAgainstJSONSchema('POST', '/site/{site_id}/domain', 400, body);
        expect(body.message).to.eq(
          'A domain with the same branch config already exists for the site.'
        );
      });
    });

    describe('when the branch config does not exist for a site', () => {
      it('returns a 400', async () => {
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const user = await userPromise;
        const names = 'www.agency.gov';

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/domain`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            siteBranchConfigId: 8675309,
            names: names,
          })
          .expect(400);

        validateAgainstJSONSchema('POST', '/site/{site_id}/domain', 400, body);
        expect(body.message).to.eq(
          'The site branch config specified for the domain does not exist.'
        );
      });
    });

    describe('when the branch config has a context of `preview` for a site domain', () => {
      it('returns a 400', async () => {
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const sbc = await factory.siteBranchConfig.create({
          site,
          branch: 'preview',
          context: 'preview',
        });
        const user = await userPromise;
        const names = 'www.agency.gov';

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/domain`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            siteBranchConfigId: sbc.id,
            names,
          })
          .expect(400);

        validateAgainstJSONSchema('POST', '/site/{site_id}/domain', 400, body);
        expect(body.message).to.eq(
          'The domain site branch config cannot have the context of "preview".'
        );
      });
    });

    describe('when the parameters are valid', () => {
      it('creates and returns the site domain', async () => {
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const siteBranchConfigId = site.SiteBranchConfigs[0].id;
        const user = await userPromise;
        const names = 'www.agency.gov';

        const cookie = await authenticatedSession(user);

        const beforeCount = await Domain.count();

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/domain`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            siteBranchConfigId,
            names,
          })
          .expect(200);

        const afterCount = await Domain.count();

        validateAgainstJSONSchema('POST', '/site/{site_id}/domain', 200, body);
        expect(body.names).to.equal(names);
        expect(body.state).to.equal('pending');
        expect(body.siteId).to.equal(site.id);
        expect(body.siteBranchConfigId).to.equal(siteBranchConfigId);
        expect(afterCount).to.eq(beforeCount + 1);
      });

      it('allows an org user to create the site domain', async () => {
        const org = await factory.organization.create();
        const role = await Role.findOne({ where: { name: 'user' } });
        const user = await factory.user();
        const site = await factory.site();
        await org.addUser(user, { through: { roleId: role.id } });
        await org.addSite(site);
        const siteBranchConfigId = site.SiteBranchConfigs[0].id;
        const names = 'www.agency.gov';

        const cookie = await authenticatedSession(user);

        const beforeCount = await Domain.count();

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/domain`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            siteBranchConfigId,
            names,
          })
          .expect(200);

        const afterCount = await Domain.count();

        validateAgainstJSONSchema('POST', '/site/{site_id}/domain', 200, body);
        expect(body.names).to.equal(names);
        expect(body.state).to.equal('pending');
        expect(body.siteId).to.equal(site.id);
        expect(body.siteBranchConfigId).to.equal(siteBranchConfigId);
        expect(afterCount).to.eq(beforeCount + 1);
      });
    });
  });

  describe('PUT /v0/site/:site_id/domain/:id', () => {
    describe('when the user is not authenticated', () => {
      it('returns a 403', async () => {
        const siteId = 1;
        const domainId = 1;

        const { body } = await request(app)
          .put(`/v0/site/${siteId}/domain/${domainId}`)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/domain/{domain_id}',
          403,
          body
        );
      });
    });

    describe('when there is no csrf token', () => {
      it('returns a 403', async () => {
        const siteId = 1;
        const domainId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .put(`/v0/site/${siteId}/domain/${domainId}`)
          .set('Cookie', cookie)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/domain/{domain_id}',
          403,
          body
        );
      });
    });

    describe('when the site does not exist', () => {
      it('returns a 404', async () => {
        const siteId = 1;
        const domainId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .put(`/v0/site/${siteId}/domain/${domainId}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/domain/{domain_id}',
          404,
          body
        );
      });
    });

    describe('when the user is not authorized to see the site', () => {
      it('returns a 404', async () => {
        const [site, user] = await Promise.all([
          factory.site(),
          factory.user(),
        ]);
        const domainId = 1;
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .put(`/v0/site/${site.id}/domain/${domainId}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/domain/{domain_id}',
          404,
          body
        );
      });
    });

    describe('when the name already exists for a site domain', () => {
      it('returns a 400', async () => {
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const user = await userPromise;
        const branch = 'demo';
        const context = 'demo';
        const names = 'www.agency.gov';
        const sbc2 = await factory.siteBranchConfig.create({
          site,
          branch,
          context,
        });

        const [_, domain2] = await Promise.all([
          factory.domain.create({
            siteId: site.id,
            siteBranchConfigId: site.SiteBranchConfigs[0].id,
            state: 'provisioned',
            names,
          }),
          factory.domain.create({
            siteId: site.id,
            siteBranchConfigId: sbc2.id,
            state: 'pending',
            names: 'demo.agency.gov',
          }),
        ]);

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .put(`/v0/site/${site.id}/domain/${domain2.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({ names })
          .expect(400);

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/domain/{domain_id}',
          400,
          body
        );
        expect(body.message).to.eq(
          'A domain with the same name already exists for the site.'
        );
      });
    });

    describe('when the branch config already exists for a site domain', () => {
      it('returns a 400', async () => {
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const user = await userPromise;
        const branch = 'demo';
        const context = 'demo';
        const names = 'www.agency.gov';
        const sbc2 = await factory.siteBranchConfig.create({
          site,
          branch,
          context,
        });

        const [_, domain2] = await Promise.all([
          factory.domain.create({
            siteId: site.id,
            siteBranchConfigId: site.SiteBranchConfigs[0].id,
            state: 'provisioned',
            names,
          }),
          factory.domain.create({
            siteId: site.id,
            siteBranchConfigId: sbc2.id,
            state: 'pending',
            names: 'demo.agency.gov',
          }),
        ]);

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .put(`/v0/site/${site.id}/domain/${domain2.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            siteBranchConfigId: site.SiteBranchConfigs[0].id,
          })
          .expect(400);

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/domain/{domain_id}',
          400,
          body
        );
        expect(body.message).to.eq(
          'A domain with the same branch config already exists for the site.'
        );
      });
    });

    describe('when the branch config does not exist for a site', () => {
      it('returns a 400', async () => {
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const user = await userPromise;
        const names = 'www.agency.gov';
        const domain = await factory.domain.create({
          siteId: site.id,
          siteBranchConfigId: site.SiteBranchConfigs[0].id,
          state: 'pending',
          names,
        });
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .put(`/v0/site/${site.id}/domain/${domain.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            siteBranchConfigId: 8675309,
            names: names,
          })
          .expect(400);

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/domain/{domain_id}',
          400,
          body
        );
        expect(body.message).to.eq(
          'The site branch config specified for the domain does not exist.'
        );
      });
    });

    describe('when the branch config has a context of `preview` for a site domain', () => {
      it('returns a 400', async () => {
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const user = await userPromise;
        const sbc2 = await factory.siteBranchConfig.create({
          site,
          branch: 'preview',
          context: 'preview',
        });
        const domain = await factory.domain.create({
          siteId: site.id,
          siteBranchConfigId: site.SiteBranchConfigs[0].id,
          state: 'pending',
        });

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .put(`/v0/site/${site.id}/domain/${domain.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            siteBranchConfigId: sbc2.id,
          })
          .expect(400);

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/domain/{domain_id}',
          400,
          body
        );
        expect(body.message).to.eq(
          'The domain site branch config cannot have the context of "preview".'
        );
      });
    });

    describe('when the domain is not in a pending state', () => {
      it('returns a 400', async () => {
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const user = await userPromise;
        const domain = await factory.domain.create({
          siteId: site.id,
          siteBranchConfigId: site.SiteBranchConfigs[0].id,
          state: 'provisioned',
        });

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .put(`/v0/site/${site.id}/domain/${domain.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            names: 'update.agency.gov',
          })
          .expect(400);

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/domain/{domain_id}',
          400,
          body
        );
        expect(
          body.message
            .split('\n')
            .map((m) => m.trim())
            .join('')
        ).to.eq(
          'The domain cannot be updated because it is provisioned.Please contact cloud.gov Pages support.'
        );
      });
    });

    describe('when the parameters are valid', () => {
      it('it updates a domain name', async () => {
        const updatedNames = 'updated.agency.gov';
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const siteBranchConfigId = site.SiteBranchConfigs[0].id;
        const user = await userPromise;
        const domain = await factory.domain.create({
          siteId: site.id,
          siteBranchConfigId,
          state: 'pending',
          origin: 'test.cool.com',
          path: 'test',
          serviceName: 'test',
        });

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .put(`/v0/site/${site.id}/domain/${domain.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            names: updatedNames,
          })
          .expect(200);

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/domain/{domain_id}',
          200,
          body
        );
        expect(body.id).to.eq(domain.id);
        expect(body.names).to.eq(updatedNames);
        expect(body.siteBranchConfigId).to.eq(siteBranchConfigId);
        expect(body.siteId).to.eq(site.id);
      });

      it('it updates a domain site branch config', async () => {
        const names = 'www.agency.gov';
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const siteBranchConfigId = site.SiteBranchConfigs[0].id;
        const user = await userPromise;
        const sbc2 = await factory.siteBranchConfig.create({
          site,
          branch: 'other',
          context: 'other',
        });
        const domain = await factory.domain.create({
          siteId: site.id,
          siteBranchConfigId,
          state: 'pending',
          names,
          origin: 'test.cool.com',
          path: 'test',
          serviceName: 'test',
        });

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .put(`/v0/site/${site.id}/domain/${domain.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            siteBranchConfigId: sbc2.id,
          })
          .expect(200);

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/domain/{domain_id}',
          200,
          body
        );
        expect(body.id).to.eq(domain.id);
        expect(body.names).to.eq(names);
        expect(body.siteBranchConfigId).to.eq(sbc2.id);
        expect(body.siteId).to.eq(site.id);
      });

      it('it updates a domain site branch config and names', async () => {
        const names = 'www.agency.gov';
        const updatedNames = 'updated.agency.gov'
        const userPromise = factory.user();
        const site = await factory.site({ users: Promise.all([userPromise]) });
        const siteBranchConfigId = site.SiteBranchConfigs[0].id;
        const user = await userPromise;
        const sbc2 = await factory.siteBranchConfig.create({
          site,
          branch: 'other',
          context: 'other',
        });
        const domain = await factory.domain.create({
          siteId: site.id,
          siteBranchConfigId,
          state: 'pending',
          names,
          origin: 'test.cool.com',
          path: 'test',
          serviceName: 'test',
        });

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .put(`/v0/site/${site.id}/domain/${domain.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            siteBranchConfigId: sbc2.id,
            names: updatedNames,
          })
          .expect(200);

        validateAgainstJSONSchema(
          'PUT',
          '/site/{site_id}/domain/{domain_id}',
          200,
          body
        );
        expect(body.id).to.eq(domain.id);
        expect(body.names).to.eq(updatedNames);
        expect(body.siteBranchConfigId).to.eq(sbc2.id);
        expect(body.siteId).to.eq(site.id);
      });
    });
  });
});
