var AWS = require('aws-sdk'),
    env = require("../../services/environment")
    cfenv = require('cfenv'),
    appEnv = cfenv.getAppEnv(),
    dbURL = appEnv.getServiceURL('federalist-staging-rds'),
    AWS_SQS_CREDS = appEnv.getServiceCreds('federalist-staging-env'),
    AWS_S3_CREDS = appEnv.getServiceCreds('federalist-staging-s3'),
    redisCreds = appEnv.getServiceCreds('federalist-staging-redis');

var _ = require('underscore');
var session = {
  cookie: {
    secure: true
  },
  proxy: true,
  secret: env.FEDERALIST_SESSION_SECRET
};

/**
 * Production environment settings
 *
 * This file can include shared settings for a production environment,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {
  grunt: {
    _hookTimeout: 60 * 1000
  }
};

// If running in Cloud Foundry with a service database available, use it
if (dbURL) {
  module.exports.connections = {
    postgres: {
      adapter: 'sails-postgresql',
      url: dbURL
    }
  };
  module.exports.models = {
    connection: 'postgres'
  };
}

// If running in Cloud Foundry with an S3 credential service available
if (AWS_SQS_CREDS && AWS_S3_CREDS) {
  module.exports.SQS = new AWS.SQS({
    accessKeyId: AWS_SQS_CREDS.FEDERALIST_AWS_BUILD_KEY,
    secretAccessKey: AWS_SQS_CREDS.FEDERALIST_AWS_BUILD_SECRET,
    region: 'us-east-1'
  });

  module.exports.S3 = new AWS.S3({
    accessKeyId: AWS_S3_CREDS.access_key_id,
    secretAccessKey: AWS_S3_CREDS.secret_access_key,
    region: AWS_S3_CREDS.region
  });
} else {
  console.log('You didn\'t define AWS user credentials for either SQS or S3!\n');
}

// If running in Cloud Foundry with a redis service
if (redisCreds) {
  session = _.extend({}, session, {
    adapter: 'redis',
    host: redisCreds.hostname,
    port: redisCreds.port,
    db: 0,
    pass: redisCreds.password
  });

  module.exports.sockets = {
    adapter: 'socket.io-redis',
    host: redisCreds.hostname,
    port: redisCreds.port,
    db: 1,
    pass: redisCreds.password
  };
}

module.exports.session = session;
