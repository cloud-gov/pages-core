const { models } = require('../models').sequelize;

function cleanDatabase() {
  const promises = Object.keys(models).map((name) => {
    const model = models[name];
    return model.destroy({
      truncate: true,
      cascade: true,
      force: true,
    });
  });

  return Promise.all(promises);
}

module.exports = cleanDatabase;
