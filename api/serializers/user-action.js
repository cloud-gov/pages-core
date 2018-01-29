const serialize = (data) => {
  const models = Array.isArray(data) ? data : [data];

  return models.map(model => model.toJSON());
};

module.exports = { serialize };
