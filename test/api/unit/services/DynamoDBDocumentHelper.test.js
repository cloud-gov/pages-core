const { expect } = require('chai');
const AWS = require('aws-sdk');

const config = require('../../../../config');

const { DynamoDBDocumentHelper } = require('../../../../api/services/DynamoDBDocumentHelper');

AWS.DynamoDB.DocumentClient = function mock() {};

// AWS.DynamoDB.DocumentClient.prototype.reset = () => AWS.DynamoDB.DocumentClient = {};

describe('DynamoDBDocumentHelper', () => {
  describe('put item', () => {
    before(() => {
      AWS.DynamoDB.DocumentClient.prototype.put = (params, cb) => {
      	if(!params.TableName || !params.Item) {
      		cb(new Error(), {});
      		return;
      	}
	    	cb(null, params);
  	  };
    });

    it('can put an item', (done) => {
      const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
      const tableName = 'myTable';
      const item = { itemKey: 'itemKeyValue' };
      docClient.put(tableName, item)
        .then((params) => {
          expect(params).to.deep.equal({ TableName: tableName, Item: item });
          done();
        })
    });

    it('cannot put an item', (done) => {
      const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
      const tableName = null;
      const item = { itemKey: 'itemKeyValue' };
      docClient.put(tableName, item)
        .catch((err) => {
        	expect(err).to.be.an('error');
          done();
        });
    });
  });

  describe('batchWrite', () => {
    before(() => {
      AWS.DynamoDB.DocumentClient.prototype.batchWrite = (params, cb) => {
      	if (params.RequestItems['badTable']) {
      		cb(new Error(), {});
      		return;
      	}
	    	cb(null, params);
  	  };
    });

    it('can put bulk items', (done) => {
      const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
      const tableName = 'myTable';
      const items = [];
      let i = 0;
      while (i < 40) {
      	items.push({ itemKey: `itemKeyValue-${i}` })
      	i += 1;
      }

      docClient.batchWrite(tableName, items)
        .then((params) => {
          expect(params.length).to.equal(3);
          done();
        })
    });

    it('cannot put bulk Items', (done) => {
      const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
      const tableName = 'badTable';
      docClient.batchWrite(tableName, [{}])
        .catch((err) => {
        	expect(err).to.be.an('error');
          done();
        });
    });
  });

  describe('delete item', () => {
    before(() => {
      AWS.DynamoDB.DocumentClient.prototype.delete = (params, cb) => {
      	if(!params.TableName || !params.Key) {
      		cb(new Error(), {});
      		return;
      	}
	    	cb(null, params);
  	  };
    });

    it('can delete an item', (done) => {
      const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
      const tableName = 'myTable';
      const key = 'myKey';
      docClient.delete(tableName, key)
        .then((params) => {
          expect(params).to.deep.equal({ TableName: tableName, Key: key });
          done();
        })
    });

    it('cannot delete an item', (done) => {
      const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
      const tableName = null;
      const key = 'myKey';
      docClient.delete(tableName, key)
        .catch((err) => {
        	expect(err).to.be.an('error');
          done();
        });
    });
  });
});
