var fs = require('fs'),
    url = require('url'),
    AWS = require('aws-sdk'),
    sqs = sails.config.SQS,
    queueUrl = sails.config.build.sqsQueue,
    awsKey = sails.config.build.awsBuildKey,
    awsSecret = sails.config.build.awsBuildSecret;

module.exports = {
  addJob: function(model) {
    var defaultBranch = model.branch === model.site.defaultBranch,
        tokensBase = {
          engine: model.site.engine,
          branch: model.branch,
          branchURL: defaultBranch ? '' : '/' + model.branch,
          root: defaultBranch ? 'site' : 'preview',
          config: model.site.config,
          repository: model.site.repository,
          owner: model.site.owner,
          sourceRepo: model.source && model.source.repository,
          sourceOwner: model.source && model.source.owner,
          token: (model.user.passport) ?
            model.user.passport.tokens.accessToken : ''
        },
        tokens = _.extend(tokensBase, {
          baseurl: (model.site.domain && defaultBranch) ? '' :
            '/' + tokensBase.root + '/' + tokensBase.owner +
            '/' + tokensBase.repository + tokensBase.branchURL,
          prefix: tokensBase.root + '/' +
            tokensBase.owner + '/' +
            tokensBase.repository +
            tokensBase.branchURL,
          callback: `${sails.config.build.callback}${model.id}/${sails.config.build.token}`
        }),
        body = {
          environment: [
            { "name": "AWS_ACCESS_KEY_ID", "value": awsKey },
            { "name": "AWS_SECRET_ACCESS_KEY", "value": awsSecret },
            { "name": "CALLBACK", "value": tokens.callback },
            { "name": "BUCKET", "value":  sails.config.build.s3Bucket },
            { "name": "BASEURL", "value": tokens.baseurl },
            { "name": "CACHE_CONTROL", "value": sails.config.build.cacheControl },
            { "name": "BRANCH", "value": tokens.branch },
            { "name": "CONFIG", "value": tokens.config },
            { "name": "REPOSITORY", "value": tokens.repository },
            { "name": "OWNER", "value": tokens.owner },
            { "name": "PREFIX", "value": tokens.prefix },
            { "name": "GITHUB_TOKEN", "value": tokens.token },
            { "name": "GENERATOR", "value": tokens.engine }
          ],
          name: sails.config.build.containerName
        },
        params = { QueueUrl: queueUrl };

    if (tokens.sourceRepo) body.environment.push({
      "name": "SOURCE_REPO",
      "value": tokens.sourceRepo
    });
    if (tokens.sourceOwner) body.environment.push({
      "name": "SOURCE_OWNER",
      "value": tokens.sourceOwner
    });

    params.MessageBody = JSON.stringify(body);

    sails.log.verbose('SQS payload build', tokens.callback, sails.config.build.s3Bucket, awsKey);

    sqs.sendMessage(params, function(err, data) {
      sails.log.verbose('message sent with error? and data', err, data);
      if (err) error(err, model);
    });

  }

};

function error(err, model) {
  sails.log.verbose('There was an error, adding the job to SQS');
  Build.completeJob(err, model);
}
