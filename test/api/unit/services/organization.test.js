const { expect } = require('chai');
const sinon = require('sinon');

const {
  uaaIdentity: uaaIdentityFactory,
  user: userFactory,
} = require('../../support/factory');

const {
  Organization,
  OrganizationRole,
  Role,
  UAAIdentity,
  User,
} = require('../../../../api/models');
const OrganizationService = require('../../../../api/services/organization/Organization');
const UAAClient = require('../../../../api/utils/uaaClient');

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

function createUserWithUAAIdentity() {
  return userFactory()
    .then(async (user) => {
      await uaaIdentityFactory({ userId: user.id });
      return user.reload({ include: [UAAIdentity] });
    });
}

function stubUAAClient(method) {
  return sinon.stub(UAAClient.prototype, method);
}

describe('OrganizationService', () => {
  beforeEach(clean);
  afterEach(sinon.restore);
  after(clean);

  describe('.inviteUAAUser', () => {
    it('invites the user in UAA and returns the invite', async () => {
      const targetUserEmail = 'foo@bar.com';
      const refreshedTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      const user = await createUserWithUAAIdentity();

      stubUAAClient('refreshToken').resolves(refreshedTokens);
      const inviteUserToUserGroupStub = stubUAAClient('inviteUserToUserGroup')
        .resolves({ email: targetUserEmail });

      const invite = await OrganizationService.inviteUAAUser(user.UAAIdentity, targetUserEmail);

      expect(invite.email).to.eq(targetUserEmail);
      sinon.assert.calledOnceWithExactly(inviteUserToUserGroupStub,
        targetUserEmail, refreshedTokens.accessToken);
    });
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
        const uaaEmail = await createUserWithUAAIdentity()
          .then(user => user.UAAIdentity.email);

        const user = await OrganizationService.findUAAUser(uaaEmail);

        expect(user.UAAIdentity.email).to.eq(uaaEmail);
      });
    });
  });

  describe('.findOrCreateUAAUser', () => {
    let inviteUAAUserStub;

    beforeEach(() => {
      inviteUAAUserStub = sinon.stub(OrganizationService, 'inviteUAAUser');
      inviteUAAUserStub.callsFake((_uaaIdentity, uaaEmail) => Promise.resolve({
        email: uaaEmail,
        userId: 'userId',
        origin: 'example.com',
        success: true,
      }));
    });

    context('when a UAA Identity with the email exists', () => {
      it('returns the User and the UAA Identity and does not invite to UAA', async () => {
        const [currentUser, targetUser] = await Promise.all([
          createUserWithUAAIdentity(),
          createUserWithUAAIdentity(),
        ]);

        const [user, invite] = await OrganizationService.findOrCreateUAAUser(
          currentUser.UAAIdentity, targetUser.UAAIdentity.email
        );

        sinon.assert.notCalled(inviteUAAUserStub);
        expect(user.UAAIdentity.email).to.eq(targetUser.UAAIdentity.email);
        expect(invite).to.be.undefined;
      });
    });

    context('when no UAA Identity with the email exists', () => {
      context('when no githubusername is provided', () => {
        it('invites the user via UAA and creates a new user and UAA Identity', async () => {
          const uaaEmail = 'foo@bar.com';
          const currentUser = await createUserWithUAAIdentity();

          expect(await OrganizationService.findUAAUser(uaaEmail)).to.be.null;

          const [user, invite] = await OrganizationService.findOrCreateUAAUser(
            currentUser.UAAIdentity, uaaEmail
          );

          sinon.assert.calledOnceWithExactly(inviteUAAUserStub, currentUser.UAAIdentity, uaaEmail);

          const userWithUAAIdentity = await OrganizationService.findUAAUser(uaaEmail);
          expect(userWithUAAIdentity.UAAIdentity.email).to.eq(uaaEmail);
          expect(user.username).to.eq(uaaEmail);
          expect(invite.email).to.eq(uaaEmail);
        });
      });

      context('when no user for the provided githubusername exists', () => {
        it('invites the user via UAA and creates a new user and UAA Identity', async () => {
          const uaaEmail = 'foo@bar.com';
          const currentUser = await createUserWithUAAIdentity();

          expect(await OrganizationService.findUAAUser(uaaEmail)).to.be.null;

          const [user, invite] = await OrganizationService.findOrCreateUAAUser(
            currentUser.UAAIdentity, uaaEmail, 'githubUsername'
          );

          sinon.assert.calledOnceWithExactly(inviteUAAUserStub, currentUser.UAAIdentity, uaaEmail);

          const userWithUAAIdentity = await OrganizationService.findUAAUser(uaaEmail);
          expect(userWithUAAIdentity.UAAIdentity.email).to.eq(uaaEmail);
          expect(user.username).to.eq(uaaEmail);
          expect(invite.email).to.eq(uaaEmail);
        });
      });

      context('when a user for the provided githubusername exists', () => {
        it('invites the user via UAA and creates a UAA Identity', async () => {
          const githubUsername = 'githubUsername';
          const uaaEmail = 'foo@bar.com';
          const currentUser = await createUserWithUAAIdentity();

          await userFactory({ username: githubUsername });

          expect(await OrganizationService.findUAAUser(uaaEmail)).to.be.null;

          const [user, invite] = await OrganizationService.findOrCreateUAAUser(
            currentUser.UAAIdentity, uaaEmail, githubUsername
          );
          sinon.assert.calledOnceWithExactly(inviteUAAUserStub, currentUser.UAAIdentity, uaaEmail);

          const userWithUAAIdentity = await OrganizationService.findUAAUser(uaaEmail);
          expect(userWithUAAIdentity.UAAIdentity.email).to.eq(uaaEmail);
          expect(user.username).to.eq(githubUsername.toLowerCase());
          expect(invite.email).to.eq(uaaEmail);
        });
      });
    });
  });

  describe('.inviteUserToOrganization', () => {
    context('when the current user does not have a UAA Identity', () => {
      it('throws an error', async () => {
        const currentUser = await userFactory();

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
        const [currentUser, org, managerRole] = await Promise.all([
          createUserWithUAAIdentity(),
          Organization.create({ name: orgName }),
          Role.findOne({ where: { name: 'manager' } }),
        ]);

        await org.addUser(currentUser, { through: { roleId: managerRole.id } });

        const error = await OrganizationService.inviteUserToOrganization(
          currentUser, orgName, 'invalidRoleName', ''
        ).catch(e => e);

        expect(error).to.be.an('Error');
      });
    });

    context('happy path', () => {
      it('invites the target user and adds them to the org with the provided role', async () => {
        const role = 'user';
        const githubUsername = 'username';
        const orgName = 'org';
        const uaaEmail = 'foo@bar.com';

        const targetUser = await createUserWithUAAIdentity();
        const findOrCreateUAAUserStub = sinon.stub(OrganizationService, 'findOrCreateUAAUser');
        findOrCreateUAAUserStub.callsFake(() => Promise.resolve([targetUser]));

        const [currentUser, org, managerRole] = await Promise.all([
          createUserWithUAAIdentity(),
          Organization.create({ name: orgName }),
          Role.findOne({ where: { name: 'manager' } }),
        ]);

        await org.addUser(currentUser, { through: { roleId: managerRole.id } });

        expect((await targetUser.getOrganizations()).length).to.eq(0);

        const [orgAgain, invite] = await OrganizationService.inviteUserToOrganization(
          currentUser, orgName, role, uaaEmail, githubUsername
        );

        expect(orgAgain.id).to.eq(org.id);

        sinon.assert.calledOnceWithMatch(findOrCreateUAAUserStub,
          sinon.match({ id: currentUser.UAAIdentity.id }), uaaEmail, githubUsername);

        const targetUserOrgs = await targetUser.getOrganizations();
        expect(targetUserOrgs.length).to.eq(1);
        expect(targetUserOrgs[0].id).to.eq(org.id);
        expect(invite).to.be.undefined;

        const orgRole = await OrganizationRole.findOne({
          where: { organizationId: org.id },
          include: [
            {
              model: User,
              where: { id: targetUser.id },
              required: true,
            },
            {
              model: Role,
              where: { name: role },
              required: true,
            },
          ],
        });
        expect(orgRole).to.not.be.null;
      });
    });
  });

  describe('.createOrganization', () => {
    context('when the current user does not have a UAA Identity', () => {
      it('throws an error', async () => {
        const currentUser = await userFactory();

        const error = await OrganizationService.createOrganization(
          currentUser, '', ''
        ).catch(e => e);

        expect(error).to.be.an('Error');
      });
    });

    context('happy path', () => {
      it('invites the target user and creates and adds them to the org with the manager role', async () => {
        const githubUsername = 'username';
        const orgName = 'org';
        const uaaEmail = 'foo@bar.com';

        const targetUser = await createUserWithUAAIdentity();
        const findOrCreateUAAUserStub = sinon.stub(OrganizationService, 'findOrCreateUAAUser');
        findOrCreateUAAUserStub.callsFake(() => Promise.resolve([targetUser]));

        const currentUser = await createUserWithUAAIdentity();

        expect(await Organization.findOne({ where: { name: orgName } })).to.be.null;

        const [org, invite] = await OrganizationService.createOrganization(
          currentUser, orgName, uaaEmail, githubUsername
        );

        expect(org.name).to.eq(orgName);

        sinon.assert.calledOnceWithMatch(findOrCreateUAAUserStub,
          sinon.match({ id: currentUser.UAAIdentity.id }), uaaEmail, githubUsername);

        const targetUserOrgs = await targetUser.getOrganizations();
        expect(targetUserOrgs.length).to.eq(1);
        expect(targetUserOrgs[0].id).to.eq(org.id);
        expect(invite).to.be.undefined;

        const orgRole = await OrganizationRole.findOne({
          where: { organizationId: org.id },
          include: [
            {
              model: User,
              where: { id: targetUser.id },
              required: true,
            },
            {
              model: Role,
              where: { name: 'manager' },
              required: true,
            },
          ],
        });
        expect(orgRole).to.not.be.null;
      });
    });
  });
});
