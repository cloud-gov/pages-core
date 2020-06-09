const { expect } = require('chai');
const sinon = require('sinon');
// const AWS = require('aws-sdk');
const ProxyDataSync = require('../../../../api/services/ProxyDataSync');
const { DynamoDBDocumentHelper } = require('../../../../api/services/DynamoDBDocumentHelper');

const { saveSite, saveSites, removeSite, siteToItem, getSiteKey } = ProxyDataSync;

const site = {
	id: 2,
	owner: 'testOwner',
	repository: 'testRepo',
	awsBucketName: 'testBucket',
	awsBucketRegion: 'testRegion'
}

describe('ProxyDataSync', () => {
  it('uses the site\'s subdomain as the sitekey', (done) => {
    expect(getSiteKey(site)).to.eql(site.subdomain);
    done();;
  });

  it('can save an item', (done) => {
  	const putStub = sinon.stub(DynamoDBDocumentHelper.prototype, 'put');
		saveSite(site);
		const args = putStub.args[0];
		expect(args[0]).to.be.a('string');
		expect(args[1]).to.deep.equal(siteToItem(site));
		expect(args.length).to.equal(2);
		done();
  });

  it('can delete an item', (done) => {
  	const deleteStub = sinon.stub(DynamoDBDocumentHelper.prototype, 'delete');
		removeSite(site);
		const args = deleteStub.args[0];
		expect(args[0]).to.be.a('string');
   	expect(args[1]).to.deep.equal({ id: getSiteKey(site)});
    expect(args.length).to.equal(2);
   	done();
  });

  it('can save array of sites', (done) => {
  	const batchWriteStub = sinon.stub(DynamoDBDocumentHelper.prototype, 'batchWrite');
   	saveSites([site]);
   	const args = batchWriteStub.args[0];
		expect(args[0]).to.be.a('string');
   	expect(args[1]).to.deep.equal([{ PutRequest: { Item: siteToItem(site) } }]);
    expect(args.length).to.equal(2);
   	done();
  });

  it('convert site to item', (done) => {
  	const item = {
  		id: getSiteKey(site),
			settings: {
				bucket_name: site.awsBucketName,
				bucket_region: site.awsBucketRegion,
			},
		};
		expect(item).to.deep.equal(siteToItem(site));
		done();
  })
});
