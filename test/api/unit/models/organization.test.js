const { expect } = require('chai');
const { Role, Site, Organization, User } = require('../../../../api/models');

const createSite = require('../../support/factory/site');
const createUser = require('../../support/factory/user');

function clean() {
  return Promise.all([
    Organization.truncate({ force: true, cascade: true }),
    Role.truncate({ cascade: true }),
    Site.truncate({ force: true, cascade: true }),
    User.truncate({ force: true, cascade: true }),
  ]);
}

describe('Organization model', () => {
  beforeEach(clean);

  after(clean);

  it('`name` is required', async () => {
    const error = await Organization.create({}).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeValidationError');
  });

  it('`name` is unique', async () => {
    const name = 'name';
    const role1 = await Organization.create({ name });

    const error = await Organization.create({ name }).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeUniqueConstraintError');
  });

  it('can have many users', async () => {
    const [org, role, user1, user2] = await Promise.all([
      Organization.create({ name: 'org' }),
      Role.create({ name: 'role' }),
      createUser(),
      createUser(),
    ]);

    expect(await org.hasUser(user1)).to.be.false;
    expect(await org.hasUser(user2)).to.be.false;
    
    await Promise.all([
      org.addUser(user1, { through: { roleId: role.id } }),
      org.addUser(user2, { through: { roleId: role.id } }),
    ]);

    expect(await org.hasUser(user1)).to.be.true;
    expect(await org.hasUser(user2)).to.be.true;
  });

  it('can only have one role for a user', async () => {
    const [org, role1, role2, user] = await Promise.all([
      Organization.create({ name: 'org' }),
      Role.create({ name: 'role1' }),
      Role.create({ name: 'role2' }),
      createUser(),
    ]);

    expect(await org.hasUser(user)).to.be.false;
    
    await org.addUser(user, { through: { roleId: role1.id } });
    
    expect(await org.hasUser(user)).to.be.true;

    [role1, role2].forEach(async role => {
      const error = await org.addUser(user, { through: { roleId: role.id } }).catch(e => e);
      expect(error).to.be.an('error');
      expect(error.name).to.eq('SequelizeUniqueConstraintError');
    });
  });

  it('can have many sites', async () => {
    const [org, site1, site2] = await Promise.all([
      Organization.create({ name: 'org' }),
      createSite(),
      createSite(),
    ]);

    expect(await org.hasSite(site1)).to.be.false;
    expect(await org.hasSite(site2)).to.be.false;
    
    await Promise.all([
      org.addSite(site1),
      org.addSite(site2),
    ]);

    expect(await org.hasSite(site1)).to.be.true;
    expect(await org.hasSite(site2)).to.be.true;
  });

  it('can only have a site once', async () => {
    const [org, site] = await Promise.all([
      Organization.create({ name: 'org' }),
      createSite(),
    ]);
    await org.addSite(site);
    const numSites = await org.countSites();

    await org.addSite(site);

    expect(await org.countSites()).to.eq(numSites);
  });
});