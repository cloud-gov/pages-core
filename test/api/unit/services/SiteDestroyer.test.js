const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');

const { Site, User } = require('../../../../api/models');

const factory = require('../../support/factory');

const stubs = {
  './mailer': {
    sendAlert: sinon.stub().resolves(),
  },
  './slacker': {
    sendAlert: sinon.stub().resolves(),
  },
  './GitHub': {
    deleteWebhook: sinon.stub().resolves(),
  },
  './S3SiteRemover': {
    removeSite: sinon.stub().resolves(),
    removeInfrastructure: sinon.stub().resolves(),
  },
};

const SiteDestroyer = proxyquire('../../../../api/services/SiteDestroyer', stubs);

describe('SiteDestroyer', () => {
  afterEach(async () => {
    await Promise.all([
      Site.truncate({ force: true, cascade: true }),
      User.truncate({ force: true, cascade: true }),
    ]);
  });

  describe('.destroySite(site, user)', () => {
    beforeEach(() => {
      sinon.stub(SiteDestroyer, 'queueDestroySiteInfra').resolves();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('destroys the site if it exists', async () => {
      const site = await factory.site();
      const user = null;

      const result = await SiteDestroyer.destroySite(site, user);

      await site.reload({ paranoid: false });

      expect(result).to.deep.eq(['ok']);
      expect(site.isSoftDeleted()).to.be.true;
      sinon.assert.calledOnceWithExactly(SiteDestroyer.queueDestroySiteInfra, site, user);
    });

    it('throws an error when the site cannot be destroyed', async () => {
      const error = await SiteDestroyer.destroySite(null, null).catch(e => e);

      expect(error).to.be.an('error');
      sinon.assert.notCalled(SiteDestroyer.queueDestroySiteInfra);
    });

    it('does not destroy the site when the site has a domain', async () => {
      const site = await factory.site();
      const user = null;
      const domain = await factory.domain.create({ siteId: site.id });

      const result = await SiteDestroyer.destroySite(site, user);

      await site.reload({ paranoid: false });

      expect(result[0]).to.eq('error');
      expect(result[1]).to.have.string(domain.names);
      expect(site.isSoftDeleted()).to.be.false;
      sinon.assert.notCalled(SiteDestroyer.queueDestroySiteInfra);
    });
  });

  // TODO: move this to worker tests?
  describe('.destroySiteInfra(site, user)', () => {
    afterEach(() => {
      // sinon.resetHistory() doesn't work here, maybe bc the stubs are created outside of the
      // test case?
      stubs['./GitHub'].deleteWebhook.resetHistory();
      stubs['./S3SiteRemover'].removeSite.resetHistory();
      stubs['./S3SiteRemover'].removeInfrastructure.resetHistory();
      stubs['./mailer'].sendAlert.resetHistory();
      stubs['./slacker'].sendAlert.resetHistory();
    });

    it('removes the infra AND deletes the webhook when the user is provided', async () => {
      const [site, user] = await Promise.all([
        factory.site(),
        factory.user(),
      ]);

      await SiteDestroyer.destroySiteInfra(site, user);

      sinon.assert.calledOnceWithExactly(stubs['./GitHub'].deleteWebhook, site, user.githubAccessToken);
      sinon.assert.calledOnceWithExactly(stubs['./S3SiteRemover'].removeSite, site);
      sinon.assert.calledOnceWithExactly(stubs['./S3SiteRemover'].removeInfrastructure, site);
      sinon.assert.notCalled(stubs['./mailer'].sendAlert);
      sinon.assert.notCalled(stubs['./slacker'].sendAlert);
    });

    it('removes the infra when the user is not provided', async () => {
      const site = await factory.site();

      await SiteDestroyer.destroySiteInfra(site, null);

      sinon.assert.calledOnceWithExactly(stubs['./S3SiteRemover'].removeSite, site);
      sinon.assert.calledOnceWithExactly(stubs['./S3SiteRemover'].removeInfrastructure, site);
      sinon.assert.notCalled(stubs['./mailer'].sendAlert);
      sinon.assert.notCalled(stubs['./slacker'].sendAlert);
    });

    // it('sends an alert if anything fails', async () => {
    //   const stub = stubs['./S3SiteRemover'].removeSite;
    //   stub.resetBehavior();
    //   stub.rejects(new Error('Yikes'));

    //   const site = await factory.site();

    //   const error = await SiteDestroyer.destroySiteInfra(site, null).catch(e => e);

    //   sinon.assert.calledOnceWithExactly(stubs['./S3SiteRemover'].removeSite, site);
    //   sinon.assert.notCalled(stubs['./S3SiteRemover'].removeInfrastructure);
    //   sinon.assert.calledOnce(stubs['./mailer'].sendAlert);
    //   sinon.assert.calledOnce(stubs['./slacker'].sendAlert);

    //   expect(error).to.be.an('error');
    // });
  });
});
