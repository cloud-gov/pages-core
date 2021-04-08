const { models } = require('../models').sequelize;

function cleanDatabase() {
  const promises = Object.keys(models).map((name) => {
    const model = models[name];
    const promise = model.destroy({ truncate: true, cascade: true, force: true });

    return promise;
  });

  return Promise.all(promises);
}

module.exports = cleanDatabase;
