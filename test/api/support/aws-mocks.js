const AWS = require("aws-sdk-mock")

const mocks = {
  S3: {},
  SQS: {},
}

const mockableFunctions = {
  S3: ["listObjects", "deleteObjects"],
  SQS: ["sendMessage",]
}

Object.keys(mockableFunctions).forEach(service => {
  mockableFunctions[service].forEach(functionName => {
    AWS.mock(service, functionName, (params, cb) => {
      if (mocks[service][functionName]) {
        mocks[service][functionName](params, cb)
      } else {
        cb(null, {})
      }
    })
  })
})

const resetMocks = () => {
  mocks.S3 = {}
  mocks.SQS = {}
}

module.exports = { mocks, resetMocks }
