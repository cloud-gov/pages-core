Promise.props = require('promise-props');

const AWSMocks = require('./support/aws-mocks'); // eslint-disable-line no-unused-vars
const sequelize = require('../../api/models').sequelize;

const models = sequelize.models;

const cleanDatabase = () => {
  const promises = Object.keys(models).map((name) => {
    const model = models[name];
    const promise = model.sync()
      .then(() => model.destroy({ where: {} }));

    return promise;
  });

  return Promise.all(promises);
};

before((done) => {
  sequelize.sync({ force: true })
    .then(() =>
      cleanDatabase().then(() => {
        done();
      }).catch((err) => {
        done(err);
      })
    );
});
