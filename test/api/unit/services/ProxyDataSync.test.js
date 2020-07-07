const { expect } = require('chai');
const sinon = require('sinon');

const { app: { proxySiteTable } } = require('../../../../config');
const { DynamoDBDocumentHelper } = require('../../../../api/services/DynamoDBDocumentHelper');

const ProxyDataSync = require('../../../../api/services/ProxyDataSync');

const {
  saveSite, saveSites, removeSite, siteToItem, getSiteKey,
} = ProxyDataSync;

const site = {
  id: 2,
  owner: 'testOwner',
  repository: 'testRepo',
  awsBucketName: 'testBucket',
  awsBucketRegion: 'testRegion',
  config: {},
};

describe('ProxyDataSync', () => {
  it('uses the site\'s subdomain as the sitekey', () => {
    expect(getSiteKey(site)).to.eql(site.subdomain);
  });

  it('can save an item', () => {
    const putStub = sinon.stub(DynamoDBDocumentHelper.prototype, 'put');

    saveSite(site);

    sinon.assert.calledOnceWithExactly(
      putStub, proxySiteTable, siteToItem(site)
    );
  });

  it('can delete an item', () => {
    const deleteStub = sinon.stub(DynamoDBDocumentHelper.prototype, 'delete');

    removeSite(site);

    sinon.assert.calledOnceWithExactly(
      deleteStub, proxySiteTable, { id: getSiteKey(site) }
    );
  });

  it('can save array of sites', () => {
    const batchWriteStub = sinon.stub(DynamoDBDocumentHelper.prototype, 'batchWrite');

    saveSites([site]);

    sinon.assert.calledOnceWithExactly(
      batchWriteStub,
      proxySiteTable,
      [{ PutRequest: { Item: siteToItem(site) } }]
    );
  });

  it('convert site to item w/o basicAuth', () => {
    const item = {
      id: getSiteKey(site),
      settings: {
        bucket_name: site.awsBucketName,
        bucket_region: site.awsBucketRegion,
      },
    };

    expect(item).to.deep.equal(siteToItem(site));
  });

  it('convert site to item w/ basicAuth', () => {
    const basicAuth = {
      username: 'username',
      password: 'password',
    };
    const protectedSite = { ...site };
    protectedSite.config.basicAuth = basicAuth;

    const item = {
      id: getSiteKey(site),
      settings: {
        bucket_name: site.awsBucketName,
        bucket_region: site.awsBucketRegion,
        basicAuth,
      },
    };

    expect(item).to.deep.equal(siteToItem(protectedSite));
  });
});
