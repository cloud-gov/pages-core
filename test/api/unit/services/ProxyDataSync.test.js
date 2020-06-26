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
  subdomain: 'www',
  updatedAt: new Date(),

};

describe('ProxyDataSync', () => {
  it('uses the site\'s subdomain as the sitekey', () => {
    expect(getSiteKey(site)).to.eql(site.subdomain);
  });

  it('can save an item', () => {
    const putSpy = sinon.spy(DynamoDBDocumentHelper.prototype, 'put');
    const start = new Date();
    saveSite(site);

    sinon.assert.calledOnce(putSpy);
    expect(putSpy.args[0][0]).to.equal(proxySiteTable);
    const siteItem = putSpy.args[0][1];
    expect(new Date(siteItem.UpdatedAt) >= start).to.be.true;
    delete siteItem.UpdatedAt;
    expect(siteItem).to.deep.equal({
      Id: site.subdomain,
      Settings: {
        BucketName: site.awsBucketName,
        BucketRegion: site.awsBucketRegion,
      },
      SiteUpdatedAt: site.updatedAt.toISOString(),
    });
  });

  it('can delete an item', () => {
    const deleteStub = sinon.stub(DynamoDBDocumentHelper.prototype, 'delete');

    removeSite(site);

    sinon.assert.calledOnceWithExactly(
      deleteStub, proxySiteTable, { Id: getSiteKey(site) }
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

  it('convert site to item', () => {
    const start = new Date();
    const obj = siteToItem(site);
    const item = {
      Id: getSiteKey(site),
      Settings: {
        BucketName: site.awsBucketName,
        BucketRegion: site.awsBucketRegion,
      },
      SiteUpdatedAt: site.updatedAt.toISOString(),
    };
    
    expect(start <= new Date(obj.UpdatedAt)).to.be.true;
    expect(new Date() >= new Date(obj.UpdatedAt)).to.be.true;
    delete obj.UpdatedAt;
    expect(item).to.deep.equal(obj);

  });
});
