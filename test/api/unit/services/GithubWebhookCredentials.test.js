const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const { CustomError } = require('../../../../api/utils/validators');

describe('GitHub webhook credentials', () => {
  let github;
  let helper;
  const site = { owner: 'owner', repository: 'repo' };
  const users = [];

  beforeEach(() => {
    github = {
      listSiteWebhooks: sinon.stub().resolves([]),
      setWebhook: sinon.stub().resolves({ id: 1 }),
      '@noCallThru': true,
    };
    helper = proxyquire('../../../../api/services/GithubBuildHelper', {
      './GitHub': github,
    });
  });

  it('does not list hooks when no admin token is found', async () => {
    const error = await helper
      .listSiteWebhooks(site, users, sinon.stub().resolves(undefined))
      .catch((err) => err);
    expect(error).to.be.instanceOf(CustomError);
    expect(error.status).to.equal(403);
    expect(error.message).to.contain('reconnect GitHub');
    sinon.assert.notCalled(github.listSiteWebhooks);
  });

  it('does not create hooks when no admin token is found', async () => {
    const error = await helper
      .createSiteWebhook(site, users, sinon.stub().resolves(null))
      .catch((err) => err);
    expect(error).to.be.instanceOf(CustomError);
    expect(error.status).to.equal(403);
    sinon.assert.notCalled(github.setWebhook);
  });

  it('lists hooks with a valid admin token', async () => {
    const selectToken = sinon.stub().resolves('valid-token');
    const result = await helper.listSiteWebhooks(site, users, selectToken);
    sinon.assert.calledOnceWithExactly(selectToken, site, users);
    sinon.assert.calledOnceWithExactly(github.listSiteWebhooks, site, 'valid-token');
    expect(result).to.deep.equal([]);
  });

  it('creates hooks with a valid admin token', async () => {
    const result = await helper.createSiteWebhook(
      site,
      users,
      sinon.stub().resolves('valid-token'),
    );
    sinon.assert.calledOnceWithExactly(github.setWebhook, site, 'valid-token');
    expect(result).to.deep.equal({ id: 1 });
  });

  it('preserves errors from token selection without calling GitHub', async () => {
    const failure = new Error('Token selection failed');
    const error = await helper
      .listSiteWebhooks(site, users, sinon.stub().rejects(failure))
      .catch((err) => err);
    expect(error).to.equal(failure);
    sinon.assert.notCalled(github.listSiteWebhooks);
  });
});
