const S3Client = require('../../../api/services/S3Helper').S3Client;

const resets = {
  getObject: S3Client.getObject
};

const mockableFunctions = [
  'getObject'
];

const createMock = (method, results) => {
  if (!mockableFunctions.includes(method)) {
    throw new Error(`Cannot use method: ${method} with S3HelperMocks.`)
  }

  S3Client.prototype[method] = function methodMock() {
    return results
  }
}

const resetMocks = () => {
  S3Client.prototype.getObject = resets.getObject
};

module.exports = { createMock, resetMocks };
