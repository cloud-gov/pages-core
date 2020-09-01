const { expect } = require('chai');
const factories = require('../../support/factory');
const { UserEnvironmentVariable } = require('../../../../api/models');

describe('UserEnvironmentVariable model', () => {
  describe('.forSiteUser', () => {
    it('returns values for site owners', async () => {
      const userPromise = factories.user();
      const site = await factories.site({ users: Promise.all([userPromise]) });
      const user = await userPromise;
      const uev = await factories.userEnvironmentVariable.create({ site });

      const uevs = await UserEnvironmentVariable.forSiteUser(user).findAll();

      expect(uevs.length).to.eq(1);
      expect(uevs[0].id).to.eq(uev.id);
    });

    it('does not return values for other users  not belonging to site', async () => {
      const user1Promise = factories.user();
      const user2 = await factories.user();
      const site = await factories.site({ users: Promise.all([user1Promise]) });
      await factories.userEnvironmentVariable.create({ site });

      const uevs = await UserEnvironmentVariable.forSiteUser(user2).findAll();

      expect(uevs).to.be.empty;
    });

    it('always returns an empty string for the hint', async () => {
      const uev = await factories.userEnvironmentVariable.create({ value: 'abc123' });
      expect(uev.hint).to.equal('');
    });
  });

  describe.only('requires unique name per site', () => {
    it('allows the same name for different sites', async () => {
      const name = 'foobarbaz';
      const [site1, site2] = await Promise.all([
        factories.site(),
        factories.site(),
      ]);

      await factories.userEnvironmentVariable.create({ name, site: site1 });
      const uev = await factories.userEnvironmentVariable.create({ name, site: site2 });

      expect(uev.name).to.equal(name); // A surrogate for not throwing
    });

    it('rejects the same name for a single site', async () => {
      const name = 'foobarbaz';
      const site = await factories.site();

      await factories.userEnvironmentVariable.create({ name, site });
      const error = await factories.userEnvironmentVariable.create({ name, site }).catch(e => e);
      expect(error).to.be.an('error');
      expect(error.name).to.equal('SequelizeUniqueConstraintError');
    });

    it('allows different names for a single site', async () => {
      const name1 = 'foobarbaz';
      const name2 = 'helloworld';
      const site = await factories.site();

      await factories.userEnvironmentVariable.create({ name: name1, site });
      const uev = await factories.userEnvironmentVariable.create({ name: name2, site });

      expect(uev.name).to.equal(name2); // A surrogate for not throwing
    });
  });
});
