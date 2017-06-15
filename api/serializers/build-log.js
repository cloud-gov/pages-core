const { BuildLog, Build } = require('../models');

function serializeObject(buildLog) {
  const json = buildLog.toJSON();
  json.build = buildLog.Build.toJSON();
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

function serialize(serializable, isPlaintext = false) {
  const serializationFn = isPlaintext ? serializePlaintext : serializeObject;

  if (serializable.length !== undefined) {
    const buildLogIds = serializable.map(buildLog => buildLog.id);
    const query = BuildLog.findAll({ where: { id: buildLogIds }, include: [Build] });

    return query.then(buildLogs => buildLogs.map(serializationFn));
  }

  const query = BuildLog.findById(serializable.id, { include: [Build] });
  return query.then(serializationFn);
}

module.exports = { serialize };
