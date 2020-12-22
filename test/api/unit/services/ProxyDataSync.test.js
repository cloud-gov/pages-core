const { expect } = require('chai');
const sinon = require('sinon');
const factory = require('../../support/factory');

const { app: { proxySiteTable } } = require('../../../../config');
const { DynamoDBDocumentHelper } = require('../../../../api/services/DynamoDBDocumentHelper');
const { omit } = require('../../../../api/utils');

const ProxyDataSync = require('../../../../api/services/ProxyDataSync');

const {
  saveSite, saveSites, removeSite, siteToItem, getSiteKey, saveBuild
} = ProxyDataSync;

const site = {
  id: 2,
  owner: 'testOwner',
  repository: 'testRepo',
  awsBucketName: 'testBucket',
  awsBucketRegion: 'testRegion',
  config: {},
  subdomain: 'www',
  updatedAt: new Date(),
};

describe('ProxyDataSync', () => {

  afterEach(() => {
    sinon.restore();
  });
  
  it('uses the site\'s subdomain as the sitekey', () => {
    expect(getSiteKey(site)).to.eql(site.subdomain);
  });

  it('can save an item', async () => {
    const putSpy = sinon.stub(DynamoDBDocumentHelper.prototype, 'put');
    const start = new Date();
    await saveSite(site);

    sinon.assert.calledOnce(putSpy);
    expect(putSpy.args[0][0]).to.equal(proxySiteTable);
    const siteItem = putSpy.args[0][1];
    expect(new Date(siteItem.UpdatedAt) >= start).to.be.true;
    delete siteItem.UpdatedAt;
    expect(siteItem).to.deep.equal({
      Id: site.subdomain,
      BucketName: site.awsBucketName,
      BucketRegion: site.awsBucketRegion,
      Settings: {
      },
      SiteUpdatedAt: site.updatedAt.toISOString(),
    });
  });

  it('can delete an item', async () => {
    const deleteStub = sinon.stub(DynamoDBDocumentHelper.prototype, 'delete');

    await removeSite(site);

    sinon.assert.calledOnceWithExactly(
      deleteStub, proxySiteTable, { Id: getSiteKey(site) }
    );
  });

  it('can save array of sites', async () => {
    const batchWriteStub = sinon.stub(DynamoDBDocumentHelper.prototype, 'batchWrite');

    const omitKeys = ['UpdatedAt'];
    const expectedItem = siteToItem(site);

    await saveSites([site]);

    sinon.assert.calledOnce(batchWriteStub);
    sinon.assert.calledWith(batchWriteStub, proxySiteTable);
    const obj = batchWriteStub.firstCall.lastArg;
    const actualItem = obj[0].PutRequest.Item;

    expect(omit(omitKeys, actualItem)).to.deep.equal(omit(omitKeys, expectedItem));
  });

  it('convert site to item w/o basicAuth', () => {
    const start = new Date();
    const obj = siteToItem(site);
    const item = {
      Id: getSiteKey(site),
      Settings: {
      },
      BucketName: site.awsBucketName,
      BucketRegion: site.awsBucketRegion,
      SiteUpdatedAt: site.updatedAt.toISOString(),
    };

    expect(start <= new Date(obj.UpdatedAt)).to.be.true;
    expect(new Date() >= new Date(obj.UpdatedAt)).to.be.true;
    delete obj.UpdatedAt;
    expect(item).to.deep.equal(obj);
  });

  it('convert site to item w/ basicAuth', () => {
    const start = new Date();
    const basicAuth = {
      username: 'username',
      password: 'password',
    };
    const protectedSite = { ...site };
    protectedSite.config.basicAuth = basicAuth;
    const obj = siteToItem(protectedSite);

    const item = {
      Id: getSiteKey(site),
      BucketName: site.awsBucketName,
      BucketRegion: site.awsBucketRegion,
      Settings: {
        BasicAuth: {
          Username: basicAuth.username,
          Password: basicAuth.password,
        },
      },
      SiteUpdatedAt: site.updatedAt.toISOString(),
    };

    expect(start <= new Date(obj.UpdatedAt)).to.be.true;
    expect(new Date() >= new Date(obj.UpdatedAt)).to.be.true;
    delete obj.UpdatedAt;
    expect(item).to.deep.equal(obj);
  });

  it('can save a build to item', async () => {
    const buildSettings = { test: 'settings' };
    const build = await factory.build({ url: 'https://buildomain.gov/buildPath'});
    const site = await build.getSite();
    const putSpy = sinon.stub(DynamoDBDocumentHelper.prototype, 'put');
    const start = new Date();

    await saveBuild(build, buildSettings);

    sinon.assert.calledOnce(putSpy);
    expect(putSpy.args[0][0]).to.equal(proxySiteTable);
    const buildItem = putSpy.args[0][1];
    expect(new Date(buildItem.UpdatedAt) >= start).to.be.true;
    delete buildItem.UpdatedAt;
    expect(buildItem).to.eql({
      Id: 'buildomain.gov/buildPath',
      Settings: buildSettings,
    });
  });
});
