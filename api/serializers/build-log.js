function serializeObject(buildLog) {
  return buildLog.toJSON();
}

function serializePlaintext(buildLog) {
  // Serializes a buildLog as a text-based representation
  return [
    `Source: ${buildLog.source}`,
    `Timestamp: ${(new Date(buildLog.createdAt)).toISOString()}`,
    `Output:\n${buildLog.output}`,
  ].join('\n');
}

function serializeBuildLog(buildLog, { isPlaintext } = {}) {
  const serializationFn = isPlaintext ? serializePlaintext : serializeObject;
  return serializationFn(buildLog);
}

function serializeBuildLogs(buildLogs, { isPlaintext } = {}) {
  return buildLogs.map(buildLog => serializeBuildLog(buildLog, { isPlaintext }));
}

module.exports = { serializeBuildLogs, serializeBuildLog };
