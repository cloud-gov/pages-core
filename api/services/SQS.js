var AWS = require('aws-sdk')
var buildConfig = sails.config.build
var s3Config = sails.config.s3

var buildContainerEnvironment = (build) => ({
  AWS_DEFAULT_REGION: s3Config.region,
  AWS_ACCESS_KEY_ID: s3Config.accessKeyId,
  AWS_SECRET_ACCESS_KEY: s3Config.secretAccessKey,
  CALLBACK: `${buildConfig.callback}${build.id}/${buildConfig.token}`,
  BUCKET: s3Config.bucket,
  BASEURL: baseURLForBuild(build),
  CACHE_CONTROL: buildConfig.cacheControl,
  BRANCH: build.branch,
  CONFIG: build.site.config,
  REPOSITORY: build.site.repository,
  OWNER: build.site.owner,
  PREFIX: pathForBuild(build),
  GITHUB_TOKEN: build.user.githubAccessToken,
  GENERATOR: build.site.engine,
  SOURCE_REPO: sourceForBuild(build).repository,
  SOURCE_OWNER: sourceForBuild(build).owner
})

var defaultBranch = (build) => {
  return build.branch === build.site.defaultBranch
}

var pathForBuild = (build) => {
  if (defaultBranch(build)) {
    return `site/${build.site.owner}/${build.site.repository}`
  } else {
    return `preview/${build.site.owner}/${build.site.repository}/${build.branch}`
  }
}

var baseURLForBuild = (build) => {
  if (defaultBranch(build) && build.site.domain) {
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
