const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon');

const UAAClient = require('../../../../api/utils/uaaClient');
const cfUAANock = require('../../support/cfUAANock');
const { uaaUser } = require('../../support/factory/uaa-identity');

describe('UAAClient', () => {
  let uaaClient;

  beforeEach(() => {
    uaaClient = new UAAClient();
  });

  afterEach(() => {
    nock.cleanAll();
    sinon.restore();
  });

  describe('.fetchGroupId()', () => {
    const clientToken = 'client-token';

    it('throws if the group does not exist', async () => {
      cfUAANock.mockFetchGroupId('foo', 1, clientToken);

      const error = await uaaClient.fetchGroupId('bar', clientToken).catch(e => e);

      expect(error).to.an('Error');
    });

    it('returns the group id if the group exists', async () => {
      const groupName = 'group-name';
      const groupId = 1;

      cfUAANock.mockFetchGroupId(groupName, groupId, clientToken);

      const result = await uaaClient.fetchGroupId(groupName, clientToken);

      expect(result).to.eq(groupId);
    });
  });

  describe('.fetchGroupMembers()', () => {
    const clientToken = 'client-token';

    it('returns the group members', async () => {
      const groupId = '1';
      const users = [
        {
          emails: [{ value: 'foo@bar.com' }], id: 'fkjhskfhsd', origin: 'example.com', userName: 'foo',
        },
        {
          emails: [{ value: 'bar@baz.com' }], id: 'sdfkjhsfksfd', origin: 'example.com', userName: 'bar',
        },
      ];

      cfUAANock.mockFetchGroupMembers(groupId, users, clientToken);

      const result = await uaaClient.fetchGroupMembers(groupId, clientToken);

      expect(result).to.have.deep.members(users);
    });
  });

  describe('.fetchUserByEmail()', () => {
    const clientToken = 'client-token';

    it('returns undefined if the user does not exist', async () => {
      const email = 'foo@bar.com';

      cfUAANock.mockFetchUserByEmail(email, clientToken);

      const result = await uaaClient.fetchUserByEmail(email, clientToken);

      expect(result).to.be.undefined;
    });

    it('returns the user if it exists', async () => {
      const email = 'foo@bar.com';
      const user = { email };

      cfUAANock.mockFetchUserByEmail(email, clientToken, user);

      const result = await uaaClient.fetchUserByEmail(email, clientToken);

      expect(result.email).to.eq(user.email);
    });
  });

  describe('.inviteUser()', () => {
    const userToken = 'user-token';

    it('returns undefined if an invite could not be created', async () => {
      const email = 'foo@bar.com';

      cfUAANock.mockInviteUser(email, userToken);

      const invite = await uaaClient.inviteUser(email, userToken);

      expect(invite).to.be.undefined;
    });

    it('returns the invite', async () => {
      const email = 'foo@bar.com';
      const profile = {
        userId: 'userId',
        origin: 'example.com',
      };

      cfUAANock.mockInviteUser(email, userToken, profile);

      const invite = await uaaClient.inviteUser(email, userToken);

      expect(invite.email).to.eq(email);
      expect(invite.userId).to.eq(profile.userId);
    });
  });

  describe('.addUserToGroup()', () => {
    const clientToken = 'client-token';

    it('does not throw when user is already in the group', async () => {
      const groupId = 1;
      const profile = {
        origin: 'example.com',
        userId: 'abc123',
      };

      cfUAANock.mockAddUserToGroup(groupId, profile, clientToken, { error: 'member_already_exists' });

      await uaaClient.addUserToGroup(groupId, profile, clientToken);

      expect(true).to.be.true;
    });

    it('throws other errors', async () => {
      const groupId = 1;
      const profile = {
        origin: 'example.com',
        userId: 'abc123',
      };

      cfUAANock.mockAddUserToGroup(groupId, profile, clientToken, { error: 'something else' });

      const error = await uaaClient.addUserToGroup(groupId, profile, clientToken).catch(e => e);

      expect(error).to.be.an('Error');
    });

    it('succeeds', async () => {
      const groupId = 1;
      const profile = {
        origin: 'example.com',
        userId: 'abc123',
      };

      cfUAANock.mockAddUserToGroup(groupId, profile, clientToken);

      await uaaClient.addUserToGroup(groupId, profile, clientToken);

      expect(true).to.be.true;
    });
  });

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

  describe('.inviteUserToUserGroup()', () => {
    const clientToken = 'client-token';

    beforeEach(async () => {
      cfUAANock.mockFetchClientToken(clientToken, 'scim.read,scim.invite,scim.write');
    });

    context('when the UAA user exists, but is not in the group', () => {
      it('does not send an invite but adds to the group', async () => {
        const email = 'foo@bar.com';
        const origin = 'example.com';
        const userId = '1';
        const user = {
          id: userId,
          email,
          groups: [],
          origin,
        };
        const groupId = 1;
        const userToken = 'user-token';

        cfUAANock.mockFetchUserByEmail(email, clientToken, user);
        cfUAANock.mockFetchGroupId('pages.user', groupId, clientToken);
        cfUAANock.mockAddUserToGroup(groupId, { userId }, clientToken);
        const inviteUserSpy = sinon.spy(uaaClient, 'inviteUser');
        const addUserToGroupSpy = sinon.spy(uaaClient, 'addUserToGroup');

        const uaaUserAttributes = await uaaClient.inviteUserToUserGroup(email, userToken);

        sinon.assert.notCalled(inviteUserSpy);
        sinon.assert.calledOnceWithMatch(addUserToGroupSpy,
          groupId, sinon.match({ origin, userId }), clientToken);
        expect(uaaUserAttributes.inviteLink).to.be.undefined;
      });
    });

    context('when the UAA user exists and is in the group', () => {
      it('does not send an invite or add to group', async () => {
        const email = 'foo@bar.com';
        const origin = 'example.com';
        const userId = '1';
        const user = {
          id: userId,
          email,
          groups: [{ display: 'pages.user' }],
          origin,
        };

        cfUAANock.mockFetchUserByEmail(email, clientToken, user);
        const inviteUserSpy = sinon.spy(uaaClient, 'inviteUser');
        const addUserToGroupSpy = sinon.spy(uaaClient, 'addUserToGroup');

        const uaaUserAttributes = await uaaClient.inviteUserToUserGroup(email, '');

        sinon.assert.notCalled(inviteUserSpy);
        sinon.assert.notCalled(addUserToGroupSpy);
        expect(uaaUserAttributes.inviteLink).to.be.undefined;
      });
    });

    context('when the UAA user does not exist', () => {
      it('returns the invite and adds the new user to the group', async () => {
        const email = 'foo@bar.com';
        const origin = 'example.com';
        const userId = '1';
        const groupId = 1;
        const userToken = 'user-token';

        cfUAANock.mockFetchUserByEmail(email, clientToken);
        cfUAANock.mockInviteUser(email, userToken, { userId, origin });
        cfUAANock.mockFetchGroupId('pages.user', groupId, clientToken);
        cfUAANock.mockAddUserToGroup(groupId, { origin, userId }, clientToken);

        const addUserToGroupSpy = sinon.spy(uaaClient, 'addUserToGroup');

        const uaaUserAttributes = await uaaClient.inviteUserToUserGroup(email, userToken);

        sinon.assert.calledOnceWithMatch(addUserToGroupSpy,
          groupId, sinon.match({ origin, userId }), clientToken);
        expect(uaaUserAttributes.email).to.eq(email);
        expect(uaaUserAttributes.userId).to.eq(userId);
      });
    });
  });

  describe('.request()', () => {
    it('should throw an error when uaa server is down', async () => {
      const error = await uaaClient.request('/foobar').catch(e => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq('Error: getaddrinfo ENOTFOUND uaa.example.com');
    });

    it('should throw and error when uaa returns an error message', async () => {
      const path = '/foobar';
      const token = 'token';
      const errorMessage = { error: 'User not allowed' };

      cfUAANock.mockServerErrorStatus(200, path, errorMessage, token);

      const error = await uaaClient.request(path, { token }).catch(e => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq(`Error: ${errorMessage.error}`);
    });

    it('should throw and error when status code greater than 399', async () => {
      const path = '/foobar';
      const token = 'token';

      cfUAANock.mockServerErrorStatus(500, path, undefined, token);

      const error = await uaaClient.request(path, { token }).catch(e => e);

      expect(error.message).to.eq('Error: Request failed with status code 500');
    });

    context('when the user does not have the appropriate scope', () => {
      it('throws a 403 error', async () => {
        const path = '/foobar';
        const token = 'token';
        const errorMessage = { error: 'User not allowed' };

        cfUAANock.mockServerErrorStatus(403, path, errorMessage, token);

        const error = await uaaClient.request(path, { token }).catch(e => e);

        expect(error).to.be.an('Error');
        expect(error.message).to.eq(`Error: ${errorMessage.error}`);
      });
    });
  });
});
