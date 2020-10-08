const { models } = require('../models').sequelize;

function cleanDatabase() {
  const promises = Object.keys(models).map((name) => {
    const model = models[name];
    // Using `force: true` removes soft deleted models and prevents uniqueness validation errors
    const promise = model.destroy({ where: {}, force: true });

    return promise;
  });

  return Promise.all(promises);
}

module.exports = cleanDatabase;
