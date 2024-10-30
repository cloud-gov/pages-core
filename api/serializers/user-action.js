const toJSON = (userAction) => {
  const record = userAction.get({
    plain: true,
  });

  record.createdAt = record.createdAt.toISOString();

  return record;
};

const serialize = (data) => {
  const models = Array.isArray(data) ? data : [data];

  return models.map((model) => toJSON(model));
};

module.exports = {
  serialize,
  toJSON,
};
