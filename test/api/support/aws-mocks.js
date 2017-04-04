const AWS = require("aws-sdk")

const mocks = {
  S3: {},
  SQS: {},
}

const mockableFunctions = {
  S3: ["getObject", "listObjects", "deleteObjects"],
  SQS: ["sendMessage",]
}

Object.keys(mockableFunctions).forEach(service => {
  AWS[service] = function() {}

  mockableFunctions[service].forEach(functionName => {
    AWS[service].prototype[functionName] = (params, cb) => {
      if (mocks[service][functionName]) {
        return mocks[service][functionName](params, cb)
      } else {
        cb(null, {})
      }
    }
  })
})

const resetMocks = () => {
  mocks.S3 = {}
  mocks.SQS = {}
}

module.exports = { mocks, resetMocks }
