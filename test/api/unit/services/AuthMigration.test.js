const { expect } = require('chai');
const sinon = require('sinon');

const { User } = require('../../../../api/models');
const AuthMigration = require('../../../../api/services/AuthMigration');
const Mailer = require('../../../../api/services/mailer');
const UAAClient = require('../../../../api/utils/uaaClient');

const factory = require('../../support/factory');

describe('AuthMigration', () => {
  const clientToken = 'ABC123';
  const uaaEmail = 'user@example.gov';
  const inviteLink = 'http://uaa.example.gov/invite';
  let user;

  beforeEach(async () => {
    sinon.stub(UAAClient.prototype, 'fetchClientToken').resolves(clientToken);
    sinon.stub(Mailer, 'sendUAAInvite').resolves();
    user = await factory.user();
  });

  afterEach(async () => {
    sinon.restore();
    await (await user.getUAAIdentity())?.destroy({ force: true });
    await user.destroy({ force: true });
  });

  describe('.migrateUser', () => {
    context('when the email exists in UAA', () => {
      beforeEach(async () => {
        sinon.stub(UAAClient.prototype, 'inviteUserToUserGroup').resolves({
          email: uaaEmail,
          inviteLink: null,
          origin: 'example.gov',
          userId: '123abc',
        });

        await AuthMigration.migrateUser(user, uaaEmail);
      });

      it('adds the user the pages.user group', async () => {
        sinon.assert.calledOnceWithExactly(
          UAAClient.prototype.inviteUserToUserGroup,
          uaaEmail,
          clientToken
        );
      });

      it('creates a UAA identity for the user', async () => {
        const uaaIdentity = await user.getUAAIdentity();

        expect(uaaIdentity.email).to.eq(uaaEmail);
      });

      it('does NOT send an email invitation to the user', async () => {
        sinon.assert.notCalled(Mailer.sendUAAInvite);
      });
    });

    context('when the email does not exist in UAA', () => {
      beforeEach(async () => {
        sinon.stub(UAAClient.prototype, 'inviteUserToUserGroup').resolves({
          email: uaaEmail,
          inviteLink,
          origin: 'example.gov',
          userId: '123abc',
        });

        await AuthMigration.migrateUser(user, uaaEmail);
      });

      it('adds the user the pages.user group', async () => {
        sinon.assert.calledOnceWithExactly(UAAClient.prototype.inviteUserToUserGroup, uaaEmail, clientToken);
      });

      it('creates a UAA identity for the user', async () => {
        const uaaIdentity = await user.getUAAIdentity();

        expect(uaaIdentity.email).to.eq(uaaEmail);
      });

      it('sends an email invitation to the user', async () => {
        sinon.assert.calledOnceWithExactly(Mailer.sendUAAInvite, uaaEmail, inviteLink);
      });
    });
  });
});
