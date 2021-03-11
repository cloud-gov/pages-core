const { expect } = require('chai');
const { UAAIdentity, User } = require('../../../../api/models');

const { createUAAIdentity } = require('../../support/factory/uaa-identity');
const createUser = require('../../support/factory/user');

function clean() {
  return Promise.all([
    UAAIdentity.truncate({ force: true, cascade: true }),
    User.truncate({ force: true, cascade: true }),
  ]);
}

describe('UAAIdentity model', () => {
  beforeEach(clean);

  after(clean);

  it('`uuaId` is required', async () => {
    const error = await UAAIdentity.create({}).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeValidationError');
  });

  it('`uuaId` is unique', async () => {
    const [user1, user2] = await Promise.all([createUser(), createUser()]);
    const uaaId = 'test-uuaId';
    await createUAAIdentity({
      uaaId,
      userId: user1.id,
    });
    const error = await createUAAIdentity({
      uaaId,
      userId: user2.id,
    }).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeUniqueConstraintError');
  });

  it('`userName` is required', async () => {
    const uaaId = 'uaa-id';
    const error = await UAAIdentity.create({ uaaId }).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeValidationError');
  });

  it('`userName` is unique', async () => {
    const [user1, user2] = await Promise.all([createUser(), createUser()]);
    const username = 'name';
    await createUAAIdentity({
      username,
      userId: user1.id,
    });
    const error = await createUAAIdentity({
      username,
      userId: user2.id,
    }).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeUniqueConstraintError');
  });

  it('`email` is required', async () => {
    const uaaId = 'uaa-id';
    const userName = 'username';
    const error = await UAAIdentity.create({ uaaId, userName }).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeValidationError');
  });

  it('`email` is valid', async () => {
    const user = await createUser();
    const email = 'not-an-email';
    const error = await createUAAIdentity({
      email,
      userId: user.id,
    }).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeValidationError');
  });

  it('`email` is unique', async () => {
    const [user1, user2] = await Promise.all([createUser(), createUser()]);
    const email = 'email@example.gov';
    await createUAAIdentity({
      email,
      userId: user1.id,
    });

    const error = await createUAAIdentity({
      email,
      userId: user2.id,
    }).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeUniqueConstraintError');
  });

  it('`origin` is required', async () => {
    const uaaId = 'uaa-id';
    const userName = 'username';
    const email = 'email@example.gov';
    const error = await UAAIdentity.create({
      uaaId,
      userName,
      email,
    }).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeValidationError');
  });

  it('`verified` defaults to false', async () => {
    const user = await createUser();
    const uaaId = 'uaa-id';
    const userName = 'username';
    const email = 'email@example.gov';
    const origin = 'example.gov';
    const identity = await UAAIdentity.create({
      uaaId,
      userName,
      email,
      origin,
      userId: user.id,
    });

    expect(identity.verified).to.be.false;
  });

  it('`userId` is required', async () => {
    const uaaId = 'uaa-id';
    const userName = 'username';
    const email = 'email@example.gov';
    const origin = 'example.gov';
    const error = await UAAIdentity.create({
      uaaId,
      userName,
      email,
      origin,
    }).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeDatabaseError');
  });

  it('`userId` is unique', async () => {
    const user = await createUser();
    const uaaId = 'uaa-id';
    const userName = 'username';
    const email = 'email@example.gov';
    const origin = 'example.gov';
    await UAAIdentity.create({
      uaaId,
      userName,
      email,
      origin,
      userId: user.id,
    });

    const error = await UAAIdentity.create({
      uaaId,
      userName,
      email,
      origin,
      userId: user.id,
    }).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeUniqueConstraintError');
  });

  it('should belong to one user', async () => {
    const [user1, user2] = await Promise.all([createUser(), createUser()]);
    const identity = await createUAAIdentity({ userId: user1.id });
    const user1Identity = await user1.getUAAIdentity();
    const identityUser = await identity.getUser();

    expect(user1Identity.dataValues).to.deep.equal(identity.dataValues);
    expect(identityUser.dataValues).to.deep.equal(user1.dataValues);
    expect(await user2.getUAAIdentity()).to.be.null;
  });
});
