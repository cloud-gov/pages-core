var buildConfig = sails.config.build
var SQS = sails.config.SQS

var buildContainerEnvironment = (build) => ({
  AWS_DEFAULT_REGION: buildConfig.awsRegion,
  AWS_ACCESS_KEY_ID: buildConfig.awsBuildKey,
  AWS_SECRET_ACCESS_KEY: buildConfig.awsBuildSecret,
  CALLBACK: `${buildConfig.callback}${build.id}/${buildConfig.token}`,
  BUCKET: buildConfig.s3Bucket,
  BASEURL: baseURLForBuild(build),
  CACHE_CONTROL: buildConfig.cacheControl,
  BRANCH: build.branch,
  CONFIG: build.site.config,
  REPOSITORY: build.site.repository,
  OWNER: build.site.owner,
  PREFIX: pathForBuild(build),
  GITHUB_TOKEN: githubTokenForBuild(build),
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

var githubTokenForBuild = (build) => {
  if (build.user.passport) {
    return build.user.passport.tokens.accessToken
  } else {
    return ""
  }
}

var sourceForBuild = (build) => {
  return build.source || {}
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
    QueueUrl: buildConfig.sqsQueue,
    MessageBody: JSON.stringify(SQS.messageBodyForBuild(build))
  }
  SQS.sendMessage(params, function(err, data) {
    if (err) {
      sails.log.error('There was an error, adding the job to SQS: ', err);
      Build.completeJob(err, build);
    }
  })
}

module.exports = SQS
