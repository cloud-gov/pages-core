const { expect } = require('chai');
const sinon = require('sinon');
const { verifyUAAUser } = require('../../../../api/services/uaaStrategy');
const { UAAIdentity, User } = require('../../../../api/models');
const EventCreator = require('../../../../api/services/EventCreator');
const cfUAANock = require('../../support/cfUAANock');
const createUser = require('../../support/factory/user');
const { createUAAIdentity, uaaUser, uaaProfile } = require('../../support/factory/uaa-identity');

function clean() {
  return Promise.all([
    UAAIdentity.truncate({ force: true, cascade: true }),
    User.truncate({ force: true, cascade: true }),
  ]);
}

describe('verifyUAAUser', () => {
  let eventAuditStub;

  beforeEach(async () => {
    eventAuditStub = sinon.stub(EventCreator, 'audit').resolves();
    await clean()
  });

  afterEach(() => sinon.restore());
  after(clean);

  it('should return a verified user in the specified group', async () => {
    const accessToken = 'a-token';
    const refreshToken = 'refresh-token';
    const user = await createUser();
    const identity = await createUAAIdentity({ userId: user.id });
    const { uaaId } = identity;
    const uaaUserResponse = uaaUser({
      uaaId,
      groups: [{
        display: 'group.one',
      }, {
        display: 'group.two',
      }],
    });

    const uaaUserProfile = uaaProfile({
      userId: uaaId,
      email: identity.email,
    });

    cfUAANock.mockVerifyUserGroup(uaaId, uaaUserResponse);

    expect(identity.accessToken).to.be.null;
    expect(identity.refreshToken).to.be.null;

    const verifiedUser = await verifyUAAUser(
      accessToken, refreshToken, uaaUserProfile, ['group.one']
    );

    await identity.reload();

    expect(verifiedUser.dataValues).to.deep.equal(user.dataValues);
    expect(identity.accessToken).to.equal(accessToken);
    expect(identity.refreshToken).to.equal(refreshToken);
  });

  it('should return null when user is not in the specified group', async () => {
    const accessToken = 'a-token';
    const refreshToken = 'refresh-token';
    const user = await createUser();
    const identity = await createUAAIdentity({ userId: user.id });
    const { uaaId } = identity;
    const uaaUserResponse = uaaUser({
      uaaId,
      groups: [{
        display: 'group.one',
      }, {
        display: 'group.two',
      }],
    });

    const uaaUserProfile = uaaProfile({
      userId: uaaId,
      email: identity.email,
    });

    cfUAANock.mockVerifyUserGroup(uaaId, uaaUserResponse);

    const result = await verifyUAAUser(accessToken, refreshToken, uaaUserProfile, ['group.three']);

    expect(eventAuditStub.called).to.equal(true);
    return expect(result).to.be.null;
  });

  it('should return null when uaa identity does not exist', async () => {
    const accessToken = 'a-token';
    const refreshToken = 'refresh-token';
    const uaaId = 'not-a-saved-identity';
    const email = 'not-a-saved-identity@example.com';
    const uaaUserResponse = uaaUser({
      uaaId,
      groups: [{
        display: 'group.one',
      }, {
        display: 'group.two',
      }],
    });

    const uaaUserProfile = uaaProfile({
      userId: uaaId,
      email,
    });

    cfUAANock.mockVerifyUserGroup(uaaId, uaaUserResponse);

    const result = await verifyUAAUser(accessToken, refreshToken, uaaUserProfile, ['group.three']);

    expect(eventAuditStub.called).to.equal(true);
    return expect(result).to.be.null;
  });

  it('should return null when user related to identity does not exist', async () => {
    const accessToken = 'a-token';
    const refreshToken = 'refresh-token';
    const user = await createUser();
    const identity = await createUAAIdentity({ userId: user.id });
    const { uaaId } = identity;
    const uaaUserResponse = uaaUser({
      uaaId,
      groups: [{
        display: 'group.one',
      }, {
        display: 'group.two',
      }],
    });

    const uaaUserProfile = uaaProfile({
      userId: uaaId,
      email: identity.email,
    });

    cfUAANock.mockVerifyUserGroup(uaaId, uaaUserResponse);

    await user.destroy();

    const result = await verifyUAAUser(accessToken, refreshToken, uaaUserProfile, ['group.one']);

    expect(eventAuditStub.called).to.equal(true);
    return expect(result).to.be.null;
  });
});
