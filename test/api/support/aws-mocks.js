const AWS = require('aws-sdk');

const mocks = {
  S3: {},
  SQS: {},
};

const mockableFunctions = {
  S3: ['getObject', 'listObjectsV2', 'deleteObjects'],
  SQS: ['sendMessage'],
};

Object.keys(mockableFunctions).forEach((service) => {
  AWS[service] = function mock() {};

  mockableFunctions[service].forEach((functionName) => {
    AWS[service].prototype[functionName] = (params, cb) => {
      if (mocks[service][functionName]) {
        mocks[service][functionName](params, cb);
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
