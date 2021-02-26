const { expect } = require('chai');
const { Role, User } = require('../../../../api/models');
const orgFactory = require('../../support/factory/organization');

function clean() {
  return Promise.all([
    orgFactory.truncate(),
    Role.truncate({ cascade: true }),
    User.truncate({ force: true, cascade: true }),
  ]);
}

describe('User model', () => {
  beforeEach(clean);

  after(clean);

  it('lowercases usernames on save', () => {
    const mixedCaseName = 'SoManyCases';
    User.create({
      username: mixedCaseName,
    })
    .then((user) => {
      expect(user.username).to.equal(mixedCaseName.toLowerCase());
    });
  });

  describe('validations', () => {
    it('should validate that an email is formatted properly if present', done => {
      User.create({
        username: 'bad-email-user',
        email: 'thisisnotanemail',
      })
      .then(() =>
        done(new Error('Excepted validation error'))
      )
      .catch(err => {
        expect(err.name).to.equal('SequelizeValidationError');
        expect(err.errors[0].path).to.equal('email');
        done();
      })
      .catch(done);
    });

    it('should require a username to be present', done => {
      User.create({
        username: null,
        email: 'email-me@example.com',
      })
      .then(() =>
        done(new Error('Excepted validation error'))
      )
      .catch(err => {
        expect(err.name).to.equal('SequelizeValidationError');
        expect(err.errors[0].path).to.equal('username');
        done();
      })
      .catch(done);
    });
  });

  it('can have many organizations', async () => {
    const [org1, org2, role, user] = await Promise.all([
      orgFactory.create(),
      orgFactory.create(),
      Role.create({ name: 'role' }),
      User.create({ username: 'user' }),
    ]);

    expect(await user.hasOrganization(org1)).to.be.false;
    expect(await user.hasOrganization(org2)).to.be.false;
    
    await Promise.all([
      user.addOrganization(org1, { through: { roleId: role.id } }),
      user.addOrganization(org2, { through: { roleId: role.id } }),
    ]);

    expect(await user.hasOrganization(org1)).to.be.true;
    expect(await user.hasOrganization(org2)).to.be.true;
  });

  it('can only have one role in an organization', async () => {
    const [org, role1, role2, user] = await Promise.all([
      orgFactory.create(),
      Role.create({ name: 'role1' }),
      Role.create({ name: 'role2' }),
      User.create({ username: 'user' }),
    ]);

    expect(await user.hasOrganization(org)).to.be.false;
    
    await user.addOrganization(org, { through: { roleId: role1.id } });
    
    expect(await user.hasOrganization(org)).to.be.true;

    [role1, role2].forEach(async role => {
      const error = await user.addOrganization(org, { through: { roleId: role.id } }).catch(e => e);
      expect(error).to.be.an('error');
      expect(error.name).to.eq('SequelizeUniqueConstraintError');
    });
  });
});
