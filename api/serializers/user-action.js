module.exports = function serialize(data) {
  const models = Array.isArray(data) ? data : [data];

  return models.map(model => model.toJSON());
};
