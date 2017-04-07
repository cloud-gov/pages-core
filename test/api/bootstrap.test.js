const AWSMocks = require("./support/aws-mocks")

const _cleanDatabase = () => {
  const models = require("../../api/models").sequelize.models
  const promises = Object.keys(models).map(name => {
    return models[name].destroy({ where: {} })
  })
  return Promise.all(promises)
}

before(function(done) {
  _cleanDatabase().then(() => {
    done()
  }).catch(err => {
    done(err)
  })
})
