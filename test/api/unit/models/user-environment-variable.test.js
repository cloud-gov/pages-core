const { expect } = require('chai');
const factories = require('../../support/factory');
const { UserEnvironmentVariable } = require('../../../../api/models');

describe('UserEnvironmentVariable model', () => {
  describe('requires unique name per site', () => {
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
