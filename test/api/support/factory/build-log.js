const buildFactory = require("./build")

const buildLog = (overrides) => {
  return Promise.props(_attributes(overrides)).then(attributes => {
    return BuildLog.create(attributes)
  })
}

const _attributes = ({ build, source, output } = {}) => ({
  build: build || buildFactory(),
  source: source || "clone.sh",
  output: output || "This is output from the build container",
})

module.exports = buildLog
