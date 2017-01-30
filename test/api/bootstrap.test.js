const AWS = require('aws-sdk-mock')
const Sails = require('sails')

let sails

const _cleanDatabase = () => {
  const models = require("../../api/modelss")
  const promises = Object.keys(models).map(name => {
    return models[name].destroy({ where: {} })
  })
  return Promise.all(promises)
}

before(function(done) {
  AWS.mock('SQS', 'sendMessage', function (params, callback) {
    callback(null, {})
  })

  Sails.lift((err, server) => {
    sails = server;
    if (err) return done(err);

    _cleanDatabase().then(() => {
      done(null, sails);
    }).catch(err => {
      done(err)
    })
  });
});

after((done) => {
  sails.lower(done);
  AWS.restore('SQS')
});
