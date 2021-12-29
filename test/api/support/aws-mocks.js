const AWS = require('aws-sdk');

const mocks = {
  S3: {},
  SQS: {},
};

const mockableFunctions = {
  S3: [
    'getObject',
    'listObjectsV2',
    'deleteObjects',
    'putObject',
    'headBucket',
  ],
  SQS: ['sendMessage'],
};

Object.keys(mockableFunctions).forEach((service) => {
  AWS[service] = function mock() {};

  mockableFunctions[service].forEach((functionName) => {
    // eslint-disable-next-line consistent-return
    AWS[service].prototype[functionName] = (params, cb) => {
      if (mocks[service][functionName]) {
        if (!cb) {
          return mocks[service][functionName](params);
        }
        mocks[service][functionName](params, cb);
        // eslint-disable-next-line consistent-return
        return;
      }
      cb(null, {});
    };
  });
});

const resetMocks = () => {
  mocks.S3 = {};
  mocks.SQS = {};
};

module.exports = { mocks, resetMocks };
