var fs = require('fs'),
    url = require('url'),
    AWS = require('aws-sdk'),
    sqs = new AWS.SQS(),
    queueUrl = sails.config.build.sqsQueue,
    awsKey = sails.config.build.awsBuildKey,
    awsSecret = sails.config.build.awsBuildSecret;

module.exports = {

  addJob: function(model) {
    var defaultBranch = model.branch === model.site.defaultBranch,
        tokens = {
          engine: model.site.engine,
          branch: model.branch,
          branchURL: defaultBranch ? '' : '/' + model.branch,
          root: defaultBranch ? 'site' : 'preview',
          config: model.site.config,
          repository: model.site.repository,
          owner: model.site.owner,
          token: (model.user.passport) ?
            model.user.passport.tokens.accessToken : '',
          baseurl: (model.site.domain && defaultBranch) ? '' :
            '/' + tokens.root + '/' + tokens.owner +
            '/' + tokens.repository + tokens.branchURL,
          prefix: tokens.root + '/' +
            tokens.owner + '/' +
            tokens.repository +
            tokens.branchURL,
          callback: url.resolve(sails.config.build.callback,
            '/' + model.id + '/' + sails.config.build.token)
        },
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
          name: model.id + '-' + model.site.owner + '-' + model.site.repository
        },
        params = {
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(body)
        };
    sqs.sendMessage(params, function(err, data) {
      if (err) error(err);
    });

  }

};
