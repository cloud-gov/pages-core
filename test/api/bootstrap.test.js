const AWS = require('aws-sdk-mock')
const app = require("../../app")

const _cleanDatabase = () => {
  const models = sequelize.models
  const promises = Object.keys(models).map(name => {
    return models[name].destroy({ where: {} })
  })
  return Promise.all(promises)
}

before(function(done) {
  AWS.mock('SQS', 'sendMessage', function (params, callback) {
    callback(null, {})
  })

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
  AWS.restore('SQS')
  done()
});
