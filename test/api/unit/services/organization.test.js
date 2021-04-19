const { expect } = require('chai');
const sinon = require('sinon');

const {
  Organization,
  OrganizationRole,
  Role,
  UAAIdentity,
  User,
} = require('../../../../api/models');
const OrganizationService = require('../../../../api/services/organization/Organization');

function clean() {
  return Promise.all(
    [
      Organization,
      OrganizationRole,
      UAAIdentity,
      User,
    ]
      .map(model => model.truncate({ force: true, cascade: true }))
  );
}

function createUserWithUAAIdentity(uaaEmail = 'foo@bar.com') {
  return User
    .create({ username: 'username' })
    .then(async (user) => {
      await user.createUAAIdentity({
        uaaId: 'aaId',
        email: uaaEmail,
        userName: 'username',
        origin: 'example.com',
      });
      return user;
    });
}

describe.only('OrganizationService', () => {
  beforeEach(clean);
  afterEach(sinon.restore);
  after(clean);

  describe('.inviteUAAUser', () => {

  });

  describe('.findUAAUser', () => {
    context('when no UAA Identity with the email exists', () => {
      it('returns null', async () => {
        const user = await OrganizationService.findUAAUser('foo@bar.com');

        expect(user).to.be.null;
      });
    });

    context('when a UAA Identity with the email exists', () => {
      it('returns the User and the UAA Identity', async () => {
        const uaaEmail = 'foo@bar.com';
        await createUserWithUAAIdentity(uaaEmail);

        const user = await OrganizationService.findUAAUser(uaaEmail);

        expect(user.UAAIdentity.email).to.eq(uaaEmail);
      });
    });
  });

  describe('.findOrCreateUAAUser', () => {
    let inviteUAAUserStub;

    beforeEach(() => {
      inviteUAAUserStub = sinon.stub(OrganizationService, 'inviteUAAUser');
      inviteUAAUserStub.callsFake((_accessToken, _uaaRole, uaaEmail) => Promise.resolve({
        email: uaaEmail,
        userId: 'userId',
        origin: 'example.com',
        success: true,
      }));
    });

    context('when a UAA Identity with the email exists', () => {
      it('returns the User and the UAA Identity and does not invite to UAA', async () => {
        const uaaEmail = 'foo@bar.com';
        await createUserWithUAAIdentity(uaaEmail);

        const user = await OrganizationService.findOrCreateUAAUser('', '', uaaEmail);

        sinon.assert.notCalled(inviteUAAUserStub);
        expect(user.UAAIdentity.email).to.eq(uaaEmail);
      });
    });

    context('when no UAA Identity with the email exists', () => {
      context('when no githubusername is provided', () => {
        it('invites the user via UAA and creates a new user and UAA Identity', async () => {
          const uaaEmail = 'foo@bar.com';
          const uaaAccessToken = 'access-token';
          const uaaRole = 'user';

          expect(await OrganizationService.findUAAUser(uaaEmail)).to.be.null;

          const user = await OrganizationService.findOrCreateUAAUser(
            uaaAccessToken, uaaRole, uaaEmail
          );

          sinon.assert.calledOnceWithExactly(inviteUAAUserStub, uaaAccessToken, uaaRole, uaaEmail);

          const userWithUAAIdentity = await OrganizationService.findUAAUser(uaaEmail);
          expect(userWithUAAIdentity.UAAIdentity.email).to.eq(uaaEmail);
          expect(user.username).to.eq(uaaEmail);
        });
      });

      context('when no user for the provided githubusername exists', () => {
        it('invites the user via UAA and creates a new user and UAA Identity', async () => {
          const uaaEmail = 'foo@bar.com';
          const uaaAccessToken = 'access-token';
          const uaaRole = 'user';

          expect(await OrganizationService.findUAAUser(uaaEmail)).to.be.null;

          const user = await OrganizationService.findOrCreateUAAUser(
            uaaAccessToken, uaaRole, uaaEmail, 'githubUsername'
          );

          sinon.assert.calledOnceWithExactly(inviteUAAUserStub, uaaAccessToken, uaaRole, uaaEmail);

          const userWithUAAIdentity = await OrganizationService.findUAAUser(uaaEmail);
          expect(userWithUAAIdentity.UAAIdentity.email).to.eq(uaaEmail);
          expect(user.username).to.eq(uaaEmail);
        });
      });

      context('when a user for the provided githubusername exists', () => {
        it('invites the user via UAA and creates a UAA Identity', async () => {
          const githubUsername = 'githubUsername';
          const uaaEmail = 'foo@bar.com';
          const uaaAccessToken = 'access-token';
          const uaaRole = 'user';

          await User.create({ username: githubUsername });

          expect(await OrganizationService.findUAAUser(uaaEmail)).to.be.null;

          const user = await OrganizationService.findOrCreateUAAUser(
            uaaAccessToken, uaaRole, uaaEmail, githubUsername
          );
          sinon.assert.calledOnceWithExactly(inviteUAAUserStub, uaaAccessToken, uaaRole, uaaEmail);

          const userWithUAAIdentity = await OrganizationService.findUAAUser(uaaEmail);
          expect(userWithUAAIdentity.UAAIdentity.email).to.eq(uaaEmail);
          expect(user.username).to.eq(githubUsername.toLowerCase());
        });
      });
    });
  });

  describe('.inviteUserToOrganization', () => {
    context('when the current user does not have a UAA Identity', () => {
      it('throws an error', async () => {
        const currentUser = await User.create({ username: 'user' });

        const error = await OrganizationService.inviteUserToOrganization(
          currentUser, '', '', ''
        ).catch(e => e);

        expect(error).to.be.an('Error');
      });
    });

    context('when the current user is not in the target org', () => {
      it('throws an error', async () => {
        const orgName = 'org';
        const [currentUser] = await Promise.all([
          createUserWithUAAIdentity(),
          Organization.create({ name: orgName }),
        ]);

        const error = await OrganizationService.inviteUserToOrganization(
          currentUser, orgName, '', ''
        ).catch(e => e);

        expect(error).to.be.an('Error');
      });
    });

    context('when the current user is not a manager in the target org', () => {
      it('throws an error', async () => {
        const orgName = 'org';
        const [currentUser, org, userRole] = await Promise.all([
          createUserWithUAAIdentity(),
          Organization.create({ name: orgName }),
          Role.findOne({ where: { name: 'user' } }),
        ]);

        await org.addUser(currentUser, { through: { roleId: userRole.id } });

        const error = await OrganizationService.inviteUserToOrganization(
          currentUser, orgName, '', ''
        ).catch(e => e);

        expect(error).to.be.an('Error');
      });
    });

    context('when an invalid role name is provided', () => {
      it('throws an error', async () => {
        const orgName = 'org';
        const [currentUser, org, userRole] = await Promise.all([
          createUserWithUAAIdentity(),
          Organization.create({ name: orgName }),
          Role.findOne({ where: { name: 'manager' } }),
        ]);

        await org.addUser(currentUser, { through: { roleId: userRole.id } });

        const error = await OrganizationService.inviteUserToOrganization(
          currentUser, orgName, 'invalidRoleName', ''
        ).catch(e => e);

        expect(error).to.be.an('Error');
      });
    });
  });

  describe('.createOrganization', () => {

  });
});
