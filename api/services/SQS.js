var AWS = require('aws-sdk')
var buildConfig = sails.config.build
var s3Config = sails.config.s3

var buildContainerEnvironment = (build) => ({
  AWS_DEFAULT_REGION: s3Config.region,
  AWS_ACCESS_KEY_ID: s3Config.accessKeyId,
  AWS_SECRET_ACCESS_KEY: s3Config.secretAccessKey,
  STATUS_CALLBACK: buildConfig.statusCallback.replace(":build_id", build.id).replace(":token", build.token),
  LOG_CALLBACK: buildConfig.logCallback.replace(":build_id", build.id).replace(":token", build.token),
  BUCKET: s3Config.bucket,
  BASEURL: baseURLForBuild(build),
  CACHE_CONTROL: buildConfig.cacheControl,
  BRANCH: build.branch,
  CONFIG: build.Site.config,
  REPOSITORY: build.Site.repository,
  OWNER: build.Site.owner,
  SITE_PREFIX: pathForBuild(build),
  GITHUB_TOKEN: build.User.githubAccessToken,
  GENERATOR: build.Site.engine,
  SOURCE_REPO: sourceForBuild(build).repository,
  SOURCE_OWNER: sourceForBuild(build).owner,
})

var defaultBranch = (build) => {
  return build.branch === build.Site.defaultBranch
}

var pathForBuild = (build) => {
  if (defaultBranch(build)) {
    return `site/${build.Site.owner}/${build.Site.repository}`
  } else {
    return `preview/${build.Site.owner}/${build.Site.repository}/${build.branch}`
  }
}

var baseURLForBuild = (build) => {
  if (defaultBranch(build) && build.Site.domain) {
    return ""
  } else {
    return "/" + pathForBuild(build)
  }
}

var sourceForBuild = (build) => {
  return build.source || {}
}

var sqsConfig = sails.config.sqs
var SQS = {
  sqsClient: new AWS.SQS({
    accessKeyId: sqsConfig.accessKeyId,
    secretAccessKey: sqsConfig.secretAccessKey,
    region: sqsConfig.region,
  }),
}

SQS.messageBodyForBuild = (build) => {
  var environment = buildContainerEnvironment(build)
  return {
    environment: Object.keys(environment).map(key => {
      return {
        name: key,
        value: environment[key]
      }
    }),
    name: buildConfig.containerName
  }
}

SQS.sendBuildMessage = build => {
  var params = {
    QueueUrl: sqsConfig.queue,
    MessageBody: JSON.stringify(SQS.messageBodyForBuild(build))
  }
  SQS.sqsClient.sendMessage(params, function(err, data) {
    if (err) {
      sails.log.error('There was an error, adding the job to SQS: ', err);
      Build.completeJob(err, build);
    }
  })
}

module.exports = SQS
