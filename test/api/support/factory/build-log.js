const buildFactory = require("./build")
const { BuildLog } = require("../../../../api/models")

const buildLog = (overrides) => {
  return Promise.props(_attributes(overrides))
    .then(attributes => {
      Object.keys(attributes).forEach(key => {
        if (attributes[key].sequelize) {
          attributes[key] = attributes[key].id
        }
      })
      return BuildLog.create(attributes)
    });
}

const _attributes = ({ build, source, output } = {}) => ({
  build: build || buildFactory(),
  source: source || "clone.sh",
  output: output || "This is output from the build container",
})

const bulkBuildLogs = async (numLogs, overrides = {}) => {
  if (!overrides.buildId) {
    const build = await buildFactory();
    overrides.build = build.id;
  } else {
    overrides.build = overrides.buildId;
  }
  const builds = await Promise.all(Array((numLogs)).fill(0).map(() => _attributes(overrides)));
  return BuildLog.bulkCreate(builds);
}

module.exports = { buildLog, bulkBuildLogs };
