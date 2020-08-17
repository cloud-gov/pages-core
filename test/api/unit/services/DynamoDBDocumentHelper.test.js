const { expect } = require('chai');
const sinon = require('sinon');
const AWS = require('aws-sdk');

const config = require('../../../../config');

const { DynamoDBDocumentHelper } = require('../../../../api/services/DynamoDBDocumentHelper');

function stubDocDBMethod(method, fn) {
  return sinon.stub(AWS.DynamoDB, 'DocumentClient')
    .returns({
      [method]: params => ({
        promise: async () => fn(params),
      }),
    });
}

describe('DynamoDBDocumentHelper', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('put item', () => {
    before(() => {
      stubDocDBMethod('put', (params) => {
        if (!params.TableName || !params.Item) {
          throw new Error();
        }
        return params;
      });
    });

    it('can put an item', async () => {
      const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
      const tableName = 'myTable';
      const item = { itemKey: 'itemKeyValue' };

      const params = await docClient.put(tableName, item);

      expect(params).to.deep.equal({ TableName: tableName, Item: item });
    });

    it('cannot put an item', async () => {
      const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
      const tableName = null;
      const item = { itemKey: 'itemKeyValue' };

      const err = await docClient.put(tableName, item).catch(e => e);

      expect(err).to.be.an('error');
    });
  });

  describe('batchWrite', () => {
    before(() => {
      stubDocDBMethod('batchWrite', (params) => {
        if (params.RequestItems.badTable) {
          throw new Error();
        }
        return params;
      });
    });

    it('can put bulk items', async () => {
      const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
      const tableName = 'myTable';
      const items = [];
      let i = 0;
      while (i < 40) {
        items.push({ itemKey: `itemKeyValue-${i}` });
        i += 1;
      }

      const params = await docClient.batchWrite(tableName, items);

      expect(params.length).to.equal(3);
    });

    it('cannot put bulk Items', async () => {
      const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
      const tableName = 'badTable';

      const err = await docClient.batchWrite(tableName, [{}]).catch(e => e);

      expect(err).to.be.an('error');
    });
  });

  describe('delete item', () => {
    before(() => {
      stubDocDBMethod('delete', (params) => {
        if (!params.TableName || !params.Key) {
          throw new Error();
        }
        return params;
      });
    });

    it('can delete an item', async () => {
      const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
      const tableName = 'myTable';
      const key = 'myKey';

      const params = await docClient.delete(tableName, key);

      expect(params).to.deep.equal({ TableName: tableName, Key: key });
    });

    it('cannot delete an item', async () => {
      const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
      const tableName = null;
      const key = 'myKey';

      const err = await docClient.delete(tableName, key).catch(e => e);

      expect(err).to.be.an('error');
    });
  });
});
