const { BuildLog, Build } = require('../models');
const buildSerializer = require('../serializers/build');

function toJSON(buildLog) {
  const object = buildLog.get({
    plain: true,
  });
  object.createdAt = object.createdAt.toISOString();
  object.updatedAt = object.updatedAt.toISOString();
  return object;
}

function serializeObject(buildLog) {
  const json = toJSON(buildLog);
  json.build = buildSerializer.toJSON(buildLog.Build);
  delete json.Build;
  return json;
}

function serializePlaintext(buildLog) {
  // Serializes a buildLog as a text-based representation
  return [
    `Source: ${buildLog.source}`,
    `Timestamp: ${buildLog.createdAt.toISOString()}`,
    `Output:\n${buildLog.output}`,
  ].join('\n');
}

function serialize(serializable, { isPlaintext } = {}) {
  const serializationFn = isPlaintext ? serializePlaintext : serializeObject;

  if (serializable.length !== undefined) {
    const buildLogIds = serializable.map(buildLog => buildLog.id);
    const query = BuildLog.findAll({ where: { id: buildLogIds }, include: [Build] });

    return query.then(buildLogs => buildLogs.map(serializationFn));
  }

  const query = BuildLog.findByPk(serializable.id, { include: [Build] });
  return query.then(serializationFn);
}

module.exports = { serialize, toJSON };
