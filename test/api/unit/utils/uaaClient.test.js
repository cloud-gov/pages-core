const { expect } = require('chai');
const nock = require('nock');

const UAAClient = require('../../../../api/utils/uaaClient');
const cfUAANock = require('../../support/cfUAANock');
const { uaaUser } = require('../../support/factory/uaa-identity');

describe('UAAClient', () => {
  describe('.verifyUserGroup()', () => {
    afterEach(() => nock.cleanAll());

    it('should verify an active user', async () => {
      const accessToken = 'a-token';
      const username = 'a-user@example.gov';
      const groupName = 'users-group';
      const groups = [{ display: 'group-1' }, { display: groupName }];
      const userIdentity = uaaUser({ username, groups });

      const uaaClient = new UAAClient(accessToken);

      cfUAANock.getUser(userIdentity.id, userIdentity, accessToken);

      const verified = await uaaClient.verifyUserGroup(userIdentity.id, groupName);
      return expect(verified).to.be.true;
    });

    it('should verify a user with cloud.gov origin and verified email', async () => {
      const accessToken = 'a-token';
      const username = 'a-user@example.gov';
      const groupName = 'users-group';
      const groups = [{ display: 'group-1' }, { display: groupName }];
      const origin = 'cloud.gov';
      const verified = true;
      const userIdentity = uaaUser({ username, groups, origin, verified });

      const uaaClient = new UAAClient(accessToken);

      cfUAANock.getUser(userIdentity.id, userIdentity, accessToken);

      const userVerified = await uaaClient.verifyUserGroup(userIdentity.id, groupName);
      return expect(userVerified).to.be.true;
    });

    it('should not verify a user with cloud.gov origin and unverified verified email', async () => {
      const accessToken = 'a-token';
      const username = 'a-user@example.gov';
      const groupName = 'users-group';
      const groups = [{ display: 'group-1' }, { display: groupName }];
      const origin = 'cloud.gov';
      const verified = false;
      const userIdentity = uaaUser({ username, groups, origin, verified });

      const uaaClient = new UAAClient(accessToken);

      cfUAANock.getUser(userIdentity.id, userIdentity, accessToken);

      const userVerified = await uaaClient.verifyUserGroup(userIdentity.id, groupName);
      return expect(userVerified).to.be.false;
    });

    it('should not verify a user not in the specified group', async () => {
      const accessToken = 'a-token';
      const username = 'a-user@example.gov';
      const groupName = 'user-not-a-member-group';
      const groups = [{ display: 'group-1' }, { display: 'group-2' }];
      const userIdentity = uaaUser({ username, groups });

      const uaaClient = new UAAClient(accessToken);

      cfUAANock.getUser(userIdentity.id, userIdentity, accessToken);

      const userVerified = await uaaClient.verifyUserGroup(userIdentity.id, groupName);
      return expect(userVerified).to.be.false;
    });

    it('should throw and error when uaa returns an error message', async () => {
      const accessToken = 'a-token';
      const groupName = 'a-group';
      const userIdentity = uaaUser();
      const errorMessage = { error: 'User not allowed' };

      const uaaClient = new UAAClient(accessToken);

      cfUAANock.getUser(userIdentity.id, errorMessage, accessToken);

      try {
        return await uaaClient.verifyUserGroup(userIdentity.id, groupName);
      } catch (error) {
        return expect(error).to.be.throw;
      }
    });

    it('should throw and error when status code greater than 399', async () => {
      const accessToken = 'a-token';
      const groupName = 'a-group';
      const userIdentity = uaaUser();
      const errorMessage = { error: 'Server not responding' };
      const uaaPath = `/Users/${userIdentity.id}`;

      const uaaClient = new UAAClient(accessToken);

      cfUAANock.serverErrorStatus(500, uaaPath, errorMessage, accessToken);

      try {
        return await uaaClient.verifyUserGroup(userIdentity.id, groupName);
      } catch (error) {
        return expect(error).to.be.throw;
      }
    });

    it('should throw an error when uaa server is down', async () => {
      const accessToken = 'a-token';
      const groupName = 'a-group';
      const userIdentity = uaaUser();
      const errorMessage = { error: 'Server not responding' };
      const uaaPath = `/Users/${userIdentity.id}`;

      const uaaClient = new UAAClient(accessToken);

      cfUAANock.serverError(uaaPath, errorMessage, accessToken);

      try {
        return await uaaClient.verifyUserGroup(userIdentity.id, groupName);
      } catch (error) {
        return expect(error).to.be.throw;
      }
    });
  });
});
