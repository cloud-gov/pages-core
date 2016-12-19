const saniztizeBuildSecrets = (values, callback) => {
  Build.findOne(values.build.id || values.build).populate("user").then(build => {
    secrets = [
      sails.config.s3.accessKeyId,
      sails.config.s3.secretAccessKey,
      sails.config.build.token,
      build.user.githubAccessToken,
    ]
    secrets.forEach(secret => {
      values.output = values.output.replace(secret, "[FILTERED]")
    })
    callback()
  })
}

module.exports = {
  schema: true,
  attributes: {
    source: {
      type: 'string',
      required: true,
    },
    output: {
      type: 'string',
      required: true,
    },
    build: {
      model: 'build',
      required: true
    },
  },

  beforeValidate: (values, cb) => {
    saniztizeBuildSecrets(values, cb)
  },
}
