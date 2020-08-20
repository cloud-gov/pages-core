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
});
