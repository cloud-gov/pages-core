const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon');

const {
  uaaIdentity: uaaIdentityFactory,
  user: userFactory,
} = require('../../support/factory');
const { UAAIdentity, User } = require('../../../../api/models');
const cfUAANock = require('../../support/cfUAANock');
const { migrateUserLoginGov } = require('../../../../api/services/user');

function clean() {
  return Promise.all(
    [UAAIdentity, User].map((model) =>
      model.truncate({
        force: true,
        cascade: true,
      }),
    ),
  );
}

describe('UserService', () => {
  beforeEach(clean);

  afterEach(async () => {
    nock.cleanAll();
    sinon.restore();
    await clean();
  });

  after(clean);

  describe('.migrateUserLoginGov()', () => {
    const clientToken = 'client-token';
    const scope = 'scim.read,scim.invite,scim.write';

    it(`migrates the local identity to the login.gov user
        and returns true`, async () => {
      const email = 'foo@bar.com';
      const oldUaaId = 'old-uaa-id';
      const loginUaaId = 'login-gov-uaa-id';
      const groupId = 1;

      const user = await userFactory();
      await uaaIdentityFactory({
        userId: user.id,
        uaaId: oldUaaId,
        email,
        origin: 'gsa.gov',
      });

      const resources = [
        { id: oldUaaId, origin: 'gsa.gov' },
        { id: loginUaaId, origin: 'login.gov' },
      ];

      cfUAANock.mockFetchClientToken(clientToken, scope);
      cfUAANock.mockFetchUserOriginByEmail(email, clientToken, resources);
      cfUAANock.mockFetchGroupId('pages.user', groupId, clientToken);
      cfUAANock.mockAddUserToGroup(groupId, { userId: loginUaaId }, clientToken);

      const result = await migrateUserLoginGov(email);

      expect(result).to.be.true;

      const identity = await UAAIdentity.findOne({
        where: {
          userId: user.id,
        },
      });
      expect(identity.uaaId).to.eq(loginUaaId);
      expect(identity.origin).to.eq('login.gov');
    });

    it('returns false when the user only has a single origin', async () => {
      const email = 'foo@bar.com';

      cfUAANock.mockFetchClientToken(clientToken, scope);
      cfUAANock.mockFetchUserOriginByEmail(email, clientToken, [
        { id: 'only-id', origin: 'gsa.gov' },
      ]);

      const result = await migrateUserLoginGov(email);

      expect(result).to.be.false;
    });

    it('returns false when there is no login.gov origin user', async () => {
      const email = 'foo@bar.com';

      cfUAANock.mockFetchClientToken(clientToken, scope);
      cfUAANock.mockFetchUserOriginByEmail(email, clientToken, [
        { id: 'id-1', origin: 'gsa.gov' },
        { id: 'id-2', origin: 'uaa' },
      ]);

      const result = await migrateUserLoginGov(email);

      expect(result).to.be.false;
    });

    it('returns false when there is no matching local identity', async () => {
      const email = 'foo@bar.com';
      const oldUaaId = 'old-uaa-id';
      const loginUaaId = 'login-gov-uaa-id';
      const groupId = 1;

      const resources = [
        { id: oldUaaId, origin: 'gsa.gov' },
        { id: loginUaaId, origin: 'login.gov' },
      ];

      cfUAANock.mockFetchClientToken(clientToken, scope);
      cfUAANock.mockFetchUserOriginByEmail(email, clientToken, resources);
      cfUAANock.mockFetchGroupId('pages.user', groupId, clientToken);
      cfUAANock.mockAddUserToGroup(groupId, { userId: loginUaaId }, clientToken);

      const result = await migrateUserLoginGov(email);

      expect(result).to.be.false;
    });
  });
});
