const { expect } = require('chai');
const nock = require('nock');

const UAAClient = require('../../../../api/utils/uaaClient');
const cfUAANock = require('../../support/cfUAANock');
const { uaaUser } = require('../../support/factory/uaa-identity');

describe('UAAClient', () => {
  let uaaClient;

  beforeEach(() => {
    uaaClient = new UAAClient();
  });

  afterEach(() => nock.cleanAll());

  describe('.verifyUserGroup()', () => {
    it('should verify an active user', async () => {
      const groupName = 'users-group';
      const allowedGroupNames = [groupName];
      const userGroups = [{ display: 'group-1' }, { display: groupName }];
      const userIdentity = uaaUser({ groups: userGroups });

      cfUAANock.mockVerifyUserGroup(userIdentity.id, userIdentity);

      const verified = await uaaClient.verifyUserGroup(userIdentity.id, allowedGroupNames);

      return expect(verified).to.be.true;
    });

    it('should verify an active user when one of the group names matches', async () => {
      const groupName = 'users-group';
      const allowedGroupNames = [groupName, 'another-group'];
      const userGroups = [{ display: 'group-1' }, { display: groupName }];
      const userIdentity = uaaUser({ groups: userGroups });

      cfUAANock.mockVerifyUserGroup(userIdentity.id, userIdentity);

      const verified = await uaaClient.verifyUserGroup(userIdentity.id, allowedGroupNames);

      return expect(verified).to.be.true;
    });

    it('should verify a user with cloud.gov origin and verified email', async () => {
      const groupName = 'users-group';
      const allowedGroupNames = [groupName];
      const userGroups = [{ display: 'group-1' }, { display: groupName }];
      const userIdentity = uaaUser({
        groups: userGroups,
        origin: 'cloud.gov',
        verified: true,
      });

      cfUAANock.mockVerifyUserGroup(userIdentity.id, userIdentity);

      const userVerified = await uaaClient.verifyUserGroup(userIdentity.id, allowedGroupNames);

      return expect(userVerified).to.be.true;
    });

    it('should not verify a user with cloud.gov origin and unverified verified email', async () => {
      const groupName = 'users-group';
      const allowedGroupNames = [groupName];
      const userGroups = [{ display: 'group-1' }, { display: groupName }];
      const userIdentity = uaaUser({
        groups: userGroups,
        origin: 'cloud.gov',
        verified: false,
      });

      cfUAANock.mockVerifyUserGroup(userIdentity.id, userIdentity);

      const userVerified = await uaaClient.verifyUserGroup(userIdentity.id, allowedGroupNames);

      return expect(userVerified).to.be.false;
    });

    it('should not verify a user not in the specified group', async () => {
      const groupName = 'user-not-a-member-group';
      const allowedGroupNames = [groupName];
      const userGroups = [{ display: 'group-1' }, { display: 'group-2' }];
      const userIdentity = uaaUser({ groups: userGroups });

      cfUAANock.mockVerifyUserGroup(userIdentity.id, userIdentity);

      const userVerified = await uaaClient.verifyUserGroup(userIdentity.id, allowedGroupNames);

      return expect(userVerified).to.be.false;
    });
  });

  describe('.inviteUser()', () => {
    context('happy path', () => {
      it('returns the invite', async () => {
        const email = 'foo@bar.com';
        const userToken = 'user-token';

        cfUAANock.mockInviteUserToUserGroup(email, userToken, 'pages.user');

        const invite = await uaaClient.inviteUserToUserGroup(email, userToken);

        expect(invite.email).to.eq(email);
      });
    });
  });

  describe('.request()', () => {
    it('should throw an error when uaa server is down', async () => {
      const error = await uaaClient.request('/foobar').catch(e => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq('getaddrinfo ENOTFOUND uaa.example.com');
    });

    it('should throw and error when uaa returns an error message', async () => {
      const path = '/foobar';
      const token = 'token';
      const errorMessage = { error: 'User not allowed' };

      cfUAANock.mockServerErrorStatus(200, path, errorMessage, token);

      const error = await uaaClient.request(path, { token }).catch(e => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq(errorMessage.error);
    });

    it('should throw and error when status code greater than 399', async () => {
      const path = '/foobar';
      const token = 'token';

      cfUAANock.mockServerErrorStatus(500, path, undefined, token);

      const error = await uaaClient.request(path, { token }).catch(e => e);

      expect(error.message).to.eq('Received status code: 500');
    });

    context('when the user does not have the appropriate scope', () => {
      it('throws a 403 error', async () => {
        const path = '/foobar';
        const token = 'token';
        const errorMessage = { error: 'User not allowed' };

        cfUAANock.mockServerErrorStatus(403, path, errorMessage, token);

        const error = await uaaClient.request(path, { token }).catch(e => e);

        expect(error).to.be.an('Error');
        expect(error.message).to.eq(errorMessage.error);
      });
    });
  });
});
