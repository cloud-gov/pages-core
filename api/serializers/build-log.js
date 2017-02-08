const serialize = (serializable) => {
  if (serializable.length !== undefined) {
    const buildLogIds = serializable.map(buildLog => buildLog.id)
    const query = BuildLog.findAll({ where: { id: buildLogIds }, include: [ Build ] })

    return query.then(buildLogs => {
      return buildLogs.map(buildLog => serializeObject(buildLog))
    })
  } else {
    const buildLog = serializable
    const query = BuildLog.findById(buildLog.id, { include: [ Build ] })

    return query.then(buildLog => {
      return serializeObject(buildLog)
    })
  }
}

const serializeObject = (buildLog) => {
  const json = buildLog.toJSON()
  json.build = json.Build
  delete json.Build
  return json
}

module.exports = { serialize }
