const deepExtend = require("deep-extend")
const fs = require("fs")
const url = require("url")

const config = {}

fs.readdirSync(__dirname).forEach(filename => {
  if (filename === "env" || filename === "index.js" || filename === "local.js" || filename.match(/.*\.sample\.js/)) {
    return
  } else {
    const filepath = [__dirname, filename].join("/")
    configName = filename.match(/^(.*).js/)[1]
    config[configName] = require(filepath)
  }
})

if (fs.existsSync([__dirname, "local.js"].join("/"))) {
  deepExtend(config, require([__dirname, "local.js"].join("/")))
}

const environment = process.env.NODE_ENV

if (environment) {
  const environmentFilepath = [__dirname, "env", environment + ".js"].join("/")
  if (fs.existsSync(environmentFilepath)) {
    deepExtend(config, require(environmentFilepath))
  }
}

module.exports = config
