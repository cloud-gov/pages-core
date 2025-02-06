const { expect } = require('chai');
const sinon = require('sinon');

const {
  organization: orgFactory,
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
    [Organization, OrganizationRole, UAAIdentity, User].map((model) =>
      model.truncate({
        force: true,
        cascade: true,
      }),
    ),
  );
}

function createUserWithUAAIdentity() {
  return userFactory().then(async (user) => {
    await uaaIdentityFactory({ userId: user.id });
    return user.reload({
      include: [UAAIdentity],
    });
  });
}

function stubUAAClient(method) {
  return sinon.stub(UAAClient.prototype, method);
}

describe('OrganizationService', () => {
  beforeEach(clean);
  afterEach(() => sinon.restore());
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
      const inviteUserToUserGroupStub = stubUAAClient('inviteUserToUserGroup').resolves({
        email: targetUserEmail,
      });

      const invite = await OrganizationService.inviteUAAUser(
        user.UAAIdentity,
        targetUserEmail,
      );

      expect(invite.email).to.eq(targetUserEmail);
      sinon.assert.calledOnceWithExactly(
        inviteUserToUserGroupStub,
        targetUserEmail,
        refreshedTokens.accessToken,
      );
    });
  });

  describe('.findUserByUAAIdentity', () => {
    context('when no UAA Identity with the email exists', () => {
      it('returns null', async () => {
        const user = await OrganizationService.findUserByUAAIdentity('foo@bar.com');

        expect(user).to.be.null;
      });
    });

    context('when a UAA Identity with the email exists', () => {
      it('returns the User and the UAA Identity', async () => {
        const uaaEmail = await createUserWithUAAIdentity().then(
          (user) => user.UAAIdentity.email,
        );

        const user = await OrganizationService.findUserByUAAIdentity(uaaEmail);

        expect(user.UAAIdentity.email).to.eq(uaaEmail);
      });
    });
  });

  describe('.findOrCreateUAAUser', () => {
    let inviteUAAUserStub;

    beforeEach(() => {
      inviteUAAUserStub = sinon.stub(OrganizationService, 'inviteUAAUser');
      inviteUAAUserStub.callsFake((_uaaIdentity, uaaEmail) =>
        Promise.resolve({
          email: uaaEmail,
          userId: 'userId',
          origin: 'example.com',
          success: true,
        }),
      );
    });

    context('when a UAA Identity with the email exists', () => {
      it('returns the User and the UAA Identity and does not invite to UAA', async () => {
        const [currentUser, targetUser] = await Promise.all([
          createUserWithUAAIdentity(),
          createUserWithUAAIdentity(),
        ]);

        const [user, invite] = await OrganizationService.findOrCreateUAAUser(
          currentUser.UAAIdentity,
          targetUser.UAAIdentity.email,
        );

        sinon.assert.notCalled(inviteUAAUserStub);
        expect(user.UAAIdentity.email).to.eq(targetUser.UAAIdentity.email);
        expect(invite.inviteLink).to.be.undefined;
      });
    });

    context('when no UAA Identity with the email exists', () => {
      context('when no githubusername is provided', () => {
        it(`invites the user via UAA
            and creates a new user and UAA Identity`, async () => {
          const uaaEmail = 'foo@bar.com';
          const currentUser = await createUserWithUAAIdentity();

          expect(await OrganizationService.findUserByUAAIdentity(uaaEmail)).to.be.null;

          const [user, invite] = await OrganizationService.findOrCreateUAAUser(
            currentUser.UAAIdentity,
            uaaEmail,
          );

          sinon.assert.calledOnceWithExactly(
            inviteUAAUserStub,
            currentUser.UAAIdentity,
            uaaEmail,
          );

          const userWithUAAIdentity =
            await OrganizationService.findUserByUAAIdentity(uaaEmail);
          expect(userWithUAAIdentity.UAAIdentity.email).to.eq(uaaEmail);
          expect(user.username).to.eq(uaaEmail);
          expect(invite.email).to.eq(uaaEmail);
        });
      });

      context('when no user for the provided githubusername exists', () => {
        it(`invites the user via UAA and
            creates a new user and UAA Identity`, async () => {
          const uaaEmail = 'foo@bar.com';
          const currentUser = await createUserWithUAAIdentity();

          expect(await OrganizationService.findUserByUAAIdentity(uaaEmail)).to.be.null;

          const [user, invite] = await OrganizationService.findOrCreateUAAUser(
            currentUser.UAAIdentity,
            uaaEmail,
            'githubUsername',
          );

          sinon.assert.calledOnceWithExactly(
            inviteUAAUserStub,
            currentUser.UAAIdentity,
            uaaEmail,
          );

          const userWithUAAIdentity =
            await OrganizationService.findUserByUAAIdentity(uaaEmail);
          expect(userWithUAAIdentity.UAAIdentity.email).to.eq(uaaEmail);
          expect(user.username).to.eq(uaaEmail);
          expect(invite.email).to.eq(uaaEmail);
        });
      });
    });
  });

  describe('.resendInvite', () => {
    context('when the current user does not have a UAA Identity', () => {
      it('throws an error', async () => {
        const currentUser = await userFactory();

        const error = await OrganizationService.resendInvite(
          currentUser,
          '',
          '',
          '',
        ).catch((e) => e);

        expect(error).to.be.an('Error');
        expect(error.message).to.contain('must have a UAA Identity');
      });
    });

    context('when the current user has a UAA identity', () => {
      it('creates and returns the UAA invite', async () => {
        const userToken = 'user-token';
        const email = 'foo@bar.com';
        const currentUser = await createUserWithUAAIdentity();

        const refreshTokenStub = sinon.stub(OrganizationService, 'refreshToken');
        refreshTokenStub.resolves(userToken);

        const inviteUserStubResponse = { email };
        const inviteUserStub = stubUAAClient('inviteUser');
        inviteUserStub.resolves(inviteUserStubResponse);

        const invite = await OrganizationService.resendInvite(currentUser, email);

        sinon.assert.calledOnceWithExactly(inviteUserStub, email, userToken);
        expect(invite).to.eq(inviteUserStubResponse);
      });
    });
  });

  describe('.inviteUserToOrganization', () => {
    context('when the current user does not have a UAA Identity', () => {
      it('throws an error', async () => {
        const currentUser = await userFactory();

        const error = await OrganizationService.inviteUserToOrganization(
          currentUser,
          null,
          null,
          '',
        ).catch((e) => e);

        expect(error).to.be.an('Error');
        expect(error.message).to.contain('must have a UAA Identity');
      });
    });

    context('when the current user is not in the target org or an admin', () => {
      it('throws an error', async () => {
        const [currentUser, { id: orgId }] = await Promise.all([
          createUserWithUAAIdentity(),
          Organization.create({
            name: 'foo',
            agency: 'GSA',
          }),
        ]);

        const error = await OrganizationService.inviteUserToOrganization(
          currentUser,
          orgId,
          null,
          '',
        ).catch((e) => e);

        expect(error).to.be.an('Error');
        expect(error.message).to.contain('a manager of the target organization');
      });
    });

    context(
      'when the current user is not a manager in the target org or an admin',
      () => {
        it('throws an error', async () => {
          const [currentUser, org, userRole] = await Promise.all([
            createUserWithUAAIdentity(),
            orgFactory.create({
              name: 'foo',
            }),
            Role.findOne({
              where: {
                name: 'user',
              },
            }),
          ]);

          await org.addUser(currentUser, {
            through: {
              roleId: userRole.id,
            },
          });

          const error = await OrganizationService.inviteUserToOrganization(
            currentUser,
            org.id,
            null,
            '',
          ).catch((e) => e);

          expect(error).to.be.an('Error');
          expect(error.message).to.contain('a manager of the target organization');
        });
      },
    );

    context('when an invalid role id is provided', () => {
      it('throws an error', async () => {
        const [currentUser, org, managerRole] = await Promise.all([
          createUserWithUAAIdentity(),
          orgFactory.create({
            name: 'foo',
          }),
          Role.findOne({
            where: {
              name: 'manager',
            },
          }),
        ]);

        await org.addUser(currentUser, {
          through: {
            roleId: managerRole.id,
          },
        });

        const error = await OrganizationService.inviteUserToOrganization(
          currentUser,
          org.id,
          999999999,
          '',
        ).catch((e) => e);

        expect(error).to.be.an('Error');
        expect(error.message).to.contain('Invalid role id');
      });
    });

    context(
      `when the current user is a manager in the target org
      and the target user exists in Pages and UAA`,
      () => {
        it('adds them to the org with the provided role', async () => {
          const uaaEmail = 'foo@bar.com';

          const targetUser = await createUserWithUAAIdentity();
          const findOrCreateUAAUserStub = sinon.stub(
            OrganizationService,
            'findOrCreateUAAUser',
          );
          findOrCreateUAAUserStub.resolves([
            targetUser,
            {
              userId: targetUser.UAAIdentity.id,
              email: targetUser.UAAIdentity.email,
            },
          ]);

          const [currentUser, org, managerRole, userRole] = await Promise.all([
            createUserWithUAAIdentity(),
            orgFactory.create({
              name: 'foo',
            }),
            Role.findOne({
              where: {
                name: 'manager',
              },
            }),
            Role.findOne({
              where: {
                name: 'user',
              },
            }),
          ]);

          await org.addUser(currentUser, {
            through: {
              roleId: managerRole.id,
            },
          });

          expect((await targetUser.getOrganizations()).length).to.eq(0);

          const uaaUserAttributes = await OrganizationService.inviteUserToOrganization(
            currentUser,
            org.id,
            userRole.id,
            uaaEmail,
          );

          sinon.assert.calledOnceWithMatch(
            findOrCreateUAAUserStub,
            sinon.match({
              id: currentUser.UAAIdentity.id,
            }),
            uaaEmail,
          );

          const targetUserOrgs = await targetUser.getOrganizations();
          expect(targetUserOrgs.length).to.eq(1);
          expect(targetUserOrgs[0].id).to.eq(org.id);
          expect(uaaUserAttributes.inviteLink).to.be.undefined;

          const orgRole = await OrganizationRole.findOne({
            where: {
              organizationId: org.id,
            },
            include: [
              {
                model: User,
                where: {
                  id: targetUser.id,
                },
                required: true,
              },
              {
                model: Role,
                where: {
                  id: userRole.id,
                },
                required: true,
              },
            ],
          });
          expect(orgRole).to.not.be.null;
        });
      },
    );

    context(
      'when the current user is a uaa admin and the target user exists in Pages and UAA',
      () => {
        it('adds them to the org with the provided role', async () => {
          const uaaEmail = 'foo@bar.com';

          const targetUser = await createUserWithUAAIdentity();
          const findOrCreateUAAUserStub = sinon.stub(
            OrganizationService,
            'findOrCreateUAAUser',
          );
          findOrCreateUAAUserStub.resolves([
            targetUser,
            {
              userId: targetUser.UAAIdentity.id,
              email: targetUser.UAAIdentity.email,
            },
          ]);

          const [currentUser, org, userRole] = await Promise.all([
            createUserWithUAAIdentity(),
            orgFactory.create({
              name: 'foo',
            }),
            Role.findOne({
              where: {
                name: 'user',
              },
            }),
          ]);

          expect((await targetUser.getOrganizations()).length).to.eq(0);

          const uaaUserAttributes = await OrganizationService.inviteUserToOrganization(
            currentUser,
            org.id,
            userRole.id,
            uaaEmail,
            true,
          );

          sinon.assert.calledOnceWithMatch(
            findOrCreateUAAUserStub,
            sinon.match({
              id: currentUser.UAAIdentity.id,
            }),
            uaaEmail,
          );

          const targetUserOrgs = await targetUser.getOrganizations();
          expect(targetUserOrgs.length).to.eq(1);
          expect(targetUserOrgs[0].id).to.eq(org.id);
          expect(uaaUserAttributes.inviteLink).to.be.undefined;

          const orgRole = await OrganizationRole.findOne({
            where: {
              organizationId: org.id,
            },
            include: [
              {
                model: User,
                where: {
                  id: targetUser.id,
                },
                required: true,
              },
              {
                model: Role,
                where: {
                  id: userRole.id,
                },
                required: true,
              },
            ],
          });
          expect(orgRole).to.not.be.null;
        });
      },
    );
  });

  describe('.createOrganization', () => {
    context('when the current user does not have a UAA Identity', () => {
      it('throws an error', async () => {
        const currentUser = await userFactory();

        const error = await OrganizationService.createOrganization(
          {},
          currentUser,
          '',
          false,
          '',
        ).catch((e) => e);

        expect(error).to.be.an('Error');
        expect(error.message).to.contain('must have a UAA Identity');
      });
    });

    context('when the current user is not a Pages admin in UAA', () => {
      // this case can't occur the only controller which calls this method
      // is in the admin API
    });

    context('when the target user exists in Pages and UAA', () => {
      it('adds them to the org with the manager role', async () => {
        const agency = 'GSA';
        const orgName = 'org';
        const uaaEmail = 'foo@bar.com';

        const targetUser = await createUserWithUAAIdentity();
        const findOrCreateUAAUserStub = sinon.stub(
          OrganizationService,
          'findOrCreateUAAUser',
        );
        findOrCreateUAAUserStub.resolves([targetUser]);

        const currentUser = await createUserWithUAAIdentity();

        expect(
          await Organization.findOne({
            where: {
              name: orgName,
            },
          }),
        ).to.be.null;

        const [org, invite] = await OrganizationService.createOrganization(
          {
            agency,
            name: orgName,
            isSelfAuthorized: false,
          },
          currentUser,
          uaaEmail,
        );

        expect(org.name).to.eq(orgName);

        sinon.assert.calledOnceWithMatch(
          findOrCreateUAAUserStub,
          sinon.match({
            id: currentUser.UAAIdentity.id,
          }),
          uaaEmail,
        );

        const targetUserOrgs = await targetUser.getOrganizations();
        expect(targetUserOrgs.length).to.eq(1);
        expect(targetUserOrgs[0].id).to.eq(org.id);
        expect(invite).to.be.undefined;

        const orgRole = await OrganizationRole.findOne({
          where: {
            organizationId: org.id,
          },
          include: [
            {
              model: User,
              where: {
                id: targetUser.id,
              },
              required: true,
            },
            {
              model: Role,
              where: {
                name: 'manager',
              },
              required: true,
            },
          ],
        });
        expect(orgRole).to.not.be.null;
      });
    });
  });

  describe('.deactivate', () => {
    it('deactivates the organization', async () => {
      const org = await orgFactory.create({ isActive: true });
      expect(org.isActive).to.be.true;
      const returnedOrg = await OrganizationService.deactivateOrganization(org);
      expect(returnedOrg.isActive).to.be.false;
      await org.reload();
      expect(org.isActive).to.be.false;
    });
  });

  describe('.activate', () => {
    it('activates the organization', async () => {
      const org = await orgFactory.create({ isActive: false });
      expect(org.isActive).to.be.false;
      const returnedOrg = await OrganizationService.activateOrganization(org);
      expect(returnedOrg.isActive).to.be.true;
      await org.reload();
      expect(org.isActive).to.be.true;
    });
  });
});
