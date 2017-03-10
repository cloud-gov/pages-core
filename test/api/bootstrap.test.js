const AWS = require('aws-sdk-mock')

AWS.mock('SQS', 'sendMessage', function (params, callback) {
  callback(null, {})
})

const app = require("../../app")

const _cleanDatabase = () => {
  const models = require("../../api/models").sequelize.models
  const promises = Object.keys(models).map(name => {
    return models[name].destroy({ where: {} })
  })
  return Promise.all(promises)
}

before(function(done) {
  app.listen(1337, (err) => {
    if (err) return done(err)

    _cleanDatabase().then(() => {
      done(null, app);
    }).catch(err => {
      done(err)
    })
  })
});

after((done) => {
  done()
});
