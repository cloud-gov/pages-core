const AWS = require('aws-sdk');
const _ = require('underscore');
const { logger } = require('../../winston');

const logError = fn => fn.promise()
  .catch((err) => {
    logger.error(err);
    throw err;
  });

class DynamoDBDocumentHelper {
  constructor(credentials) {
    this.docClient = new AWS.DynamoDB.DocumentClient({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region,
    });
  }

  put(TableName, Item) {
    const { docClient } = this;

    return logError(
      docClient.put({ TableName, Item })
    );
  }

  batchWrite(TableName, items) {
    const { docClient } = this;

    const maxItems = 15;

    const request = params => logError(
      docClient.batchWrite(params)
    );

    const allRequests = _
      .chunk(items, maxItems)
      .map(chunk => request({ RequestItems: { [TableName]: chunk } }));

    return Promise.all(allRequests);
  }


  delete(TableName, Key) {
    const { docClient } = this;

    return logError(
      docClient.delete({ TableName, Key })
    );
  }
}

module.exports = { DynamoDBDocumentHelper };
