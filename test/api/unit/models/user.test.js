const { expect } = require('chai');
const { OrganizationRole, Role, Site, User } = require('../../../../api/models');
const orgFactory = require('../../support/factory/organization');
const createSite = require('../../support/factory/site');
const createUser = require('../../support/factory/user');
const { createUAAIdentity } = require('../../support/factory/uaa-identity');

function clean() {
  return Promise.all([
    orgFactory.truncate(),
    OrganizationRole.truncate({
      force: true,
      cascade: true,
    }),
    Site.truncate({
      force: true,
      cascade: true,
    }),
    User.truncate({
      force: true,
      cascade: true,
    }),
  ]);
}

describe('User model', () => {
  let userRole;
  let managerRole;

  before(async () => {
    await clean();
    [userRole, managerRole] = await Promise.all([
      Role.findOne({
        where: {
          name: 'user',
        },
      }),
      Role.findOne({
        where: {
          name: 'manager',
        },
      }),
    ]);
  });

  afterEach(clean);

  it('lowercases usernames on save', () => {
    const mixedCaseName = 'SoManyCases';
    User.create({
      username: mixedCaseName,
    }).then((user) => {
      expect(user.username).to.equal(mixedCaseName.toLowerCase());
    });
  });

  describe('validations', () => {
    it('should validate that an email is formatted properly if present', (done) => {
      User.create({
        username: 'bad-email-user',
        email: 'thisisnotanemail',
      })
        .then(() => done(new Error('Excepted validation error')))
        .catch((err) => {
          expect(err.name).to.equal('SequelizeValidationError');
          expect(err.errors[0].path).to.equal('email');
          done();
        })
        .catch(done);
    });

    it('should require a username to be present', (done) => {
      User.create({
        username: null,
        email: 'email-me@example.com',
      })
        .then(() => done(new Error('Excepted validation error')))
        .catch((err) => {
          expect(err.name).to.equal('SequelizeValidationError');
          expect(err.errors[0].path).to.equal('username');
          done();
        })
        .catch(done);
    });
  });

  it('can have many organizations', async () => {
    const [org1, org2, user] = await Promise.all([
      orgFactory.create(),
      orgFactory.create(),
      User.create({
        username: 'user',
      }),
    ]);

    expect(await user.hasOrganization(org1)).to.be.false;
    expect(await user.hasOrganization(org2)).to.be.false;

    await Promise.all([
      user.addOrganization(org1, {
        through: {
          roleId: userRole.id,
        },
      }),
      user.addOrganization(org2, {
        through: {
          roleId: userRole.id,
        },
      }),
    ]);

    expect(await user.hasOrganization(org1)).to.be.true;
    expect(await user.hasOrganization(org2)).to.be.true;
  });

  it('can only have one role in an organization', async () => {
    const [org, user] = await Promise.all([
      orgFactory.create(),
      User.create({
        username: 'user',
      }),
    ]);

    expect(await user.hasOrganization(org)).to.be.false;

    await user.addOrganization(org, {
      through: {
        roleId: userRole.id,
      },
    });

    expect(await user.hasOrganization(org)).to.be.true;

    [userRole, managerRole].forEach(async (role) => {
      const error = await user
        .addOrganization(org, {
          through: {
            roleId: role.id,
          },
        })
        .catch((e) => e);
      expect(error).to.be.an('error');
      expect(error.name).to.eq('SequelizeUniqueConstraintError');
    });
  });

  describe('orgScope', () => {
    it('filters users by org and includes Organization', async () => {
      const [, user1, user2, org] = await Promise.all([
        createUser(),
        createUser(),
        createUser(),
        orgFactory.create(),
      ]);

      await Promise.all([
        org.addUser(user1, {
          through: {
            roleId: userRole.id,
          },
        }),
        org.addUser(user2, {
          through: {
            roleId: managerRole.id,
          },
        }),
      ]);

      const orgUsers = await User.scope(User.orgScope(org.id)).findAll();

      expect(orgUsers.map((u) => u.id)).to.have.members([user1.id, user2.id]);
      expect(orgUsers.flatMap((u) => u.Organizations.map((o) => o.id))).to.have.members([
        org.id,
        org.id,
      ]);
    });
  });

  describe('siteScope', () => {
    it('filters users by site and includes Site', async () => {
      const [, user1, user2] = await Promise.all([
        createUser(),
        createUser(),
        createUser(),
      ]);

      const site = await createSite({
        users: [user1, user2],
      });

      const siteUsers = await User.scope(User.siteScope(site.id)).findAll();

      expect(siteUsers.map((u) => u.id)).to.have.members([user1.id, user2.id]);
      expect(siteUsers.flatMap((u) => u.Sites.map((s) => s.id))).to.have.members([
        site.id,
        site.id,
      ]);
    });
  });

  describe('searchScope', () => {
    it('returns the user by id', async () => {
      const [user] = await Promise.all([createUser(), createUser()]);

      const users = await User.scope(User.searchScope(user.id)).findAll();

      expect(users.map((u) => u.id)).to.have.members([user.id]);
    });

    it('returns the user by username substring', async () => {
      const [user] = await Promise.all([
        createUser({
          username: 'foo',
        }),
        createUser({
          username: 'bar',
        }),
      ]);

      const users = await User.scope(User.searchScope('fo')).findAll();

      expect(users.map((u) => u.id)).to.have.members([user.id]);
    });

    it('returns the user by email substring', async () => {
      const [user] = await Promise.all([
        createUser({
          email: 'foo@bar.com',
        }),
        createUser({
          email: 'me@example.com',
        }),
      ]);

      const users = await User.scope(User.searchScope('fo')).findAll();

      expect(users.map((u) => u.id)).to.have.members([user.id]);
    });

    it('returns the user by UAA email substring', async () => {
      const [user1, user2] = await Promise.all([createUser(), createUser()]);

      await Promise.all([
        createUAAIdentity({
          userId: user1.id,
          email: 'jeff.probst@survivor.gov',
        }),
        createUAAIdentity({
          userId: user2.id,
          email: 'rob.mariano@survivor.gov',
        }),
      ]);

      const users = await User.scope(User.searchScope('probst')).findAll();

      expect(users.length === 1);
      expect(users.map((u) => u.id)).to.have.members([user1.id]);
    });
  });

  describe('withUAAIdentity', () => {
    it('includes the UAAIdentity', async () => {
      const { id: userId } = await createUser();
      const uaaIdentity = await createUAAIdentity({ userId });

      const user = await User.scope('withUAAIdentity').findOne({
        where: {
          id: userId,
        },
      });
      expect(user.UAAIdentity.id).to.eq(uaaIdentity.id);
    });
  });

  describe('havingUAAIdentity', () => {
    it('includes the UAAIdentity', async () => {
      const { id: userId } = await createUser();
      const uaaIdentity = await createUAAIdentity({ userId });

      const user = await User.scope('havingUAAIdentity').findOne({
        where: {
          id: userId,
        },
      });
      expect(user.UAAIdentity.id).to.eq(uaaIdentity.id);
    });

    it('excludes users without a UAAIdentity', async () => {
      const { id: userId } = await createUser();

      const user = await User.scope('havingUAAIdentity').findOne({
        where: {
          id: userId,
        },
      });
      expect(user).to.be.null;
    });
  });

  describe('byUAAEmail', () => {
    it('filters users by uaa email and includes UAAIdentity', async () => {
      const [user1, user2] = await Promise.all([createUser(), createUser()]);

      const [, uaaIdentity2] = await Promise.all([
        createUAAIdentity({
          userId: user1.id,
        }),
        createUAAIdentity({
          userId: user2.id,
        }),
      ]);

      const users = await User.byUAAEmail(uaaIdentity2.email).findAll();

      expect(users.map((u) => u.id)).to.have.members([user2.id]);
      expect(users.map((u) => u.UAAIdentity.id)).to.have.members([uaaIdentity2.id]);
    });
  });
});
