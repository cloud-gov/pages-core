Promise.props = require('promise-props');

require('./support/aws-mocks');
const sequelize = require('../../api/models').sequelize;

const models = sequelize.models;
const ActionType = models.ActionType;
const types = ['add', 'remove', 'update'];
const cleanDatabase = () => {
  const promises = Object.keys(models).map((name) => {
    const model = models[name];
    // { force: true } removes soft deleted models and prevents uniqueness validation errors
    const promise = model.destroy({ where: {}, force: true });

    return promise;
  });

  return Promise.all(promises);
};
const addActionTypes = () => Promise.all(types.map(type => ActionType.create({ action: type })));

before((done) => {
  cleanDatabase()
  .then(() => addActionTypes())
  .then(() => done())
  .catch(err => done(err));
});
