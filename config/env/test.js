function dbConfig(env) {
  if (env.CONCOURSE) {
    return {
      database: 'postgres',
      user: 'postgres',
      host: 'db',
    };
  }

  if (env.CI) {
    return {
      database: 'federalist-ci-test',
      user: 'ci-test-user',
      host: 'localhost',
    };
  }

  return {
    database: 'federalist-test',
    user: 'postgres',
    host: 'db',
  };
}

module.exports = {
  build: {
    token: '123abc',
  },
  sqs: {
    accessKeyId: '123abc',
    secretAccessKey: '456def',
    region: 'us-east-1',
    queue: 'https://sqs.us-east-1.amazonaws.com/123abc/456def',
  },
  s3: {
    accessKeyId: '123abc',
    secretAccessKey: '456def',
    region: 'us-gov-west-1',
    bucket: 'cg-123456789',
    serviceName: 'federalist-dev-s3',
  },
  dynamoDB: {
    accessKeyId: '123abc',
    secretAccessKey: '456def',
    region: 'us-gov-west-1',
  },
  passport: {
    github: {
      options: {
        clientID: '123abc',
        clientSecret: '456def',
        callbackURL: 'http://localhost:1337/auth/github/callback',
        scope: ['user', 'repo'],
      },
      externalOptions: {
        clientID: '123abc',
        clientSecret: '456def',
        callbackURL: 'http://localhost:1337/external/auth/github/callback',
        scope: ['user', 'repo'],
      },
      organizations: [
        123456,
      ],
    },
    uaa: {
      host: 'https://uaa.example.com',
      options: {
        clientID: '123abc',
        clientSecret: '456def',
        tokenURL: 'https://uaa.example.com/oauth/token',
        userURL: 'https://uaa.example.com/userinfo',
      },
      adminOptions: {
        clientID: '123abc',
        clientSecret: '456def',
        tokenURL: 'https://uaa.example.com/oauth/token',
        userURL: 'https://uaa.example.com/userinfo',
      },
    },
  },
  postgres: dbConfig(process.env),
  redis: {
    url: process.env.CI ? 'redis://localhost:6379' : 'redis://redis:6379',
  },
  log: {
    level: 'error',
    silent: true,
  },
  deployUser: {
    username: 'deploy_user',
    password: 'deploy_pass',
  },
  env: {
    cfDomainGuid: '987ihg-654fed-321cba',
    cfProxyGuid: '867fiv-309ine',
    cfSpaceGuid: '123abc-456def-789ghi',
    cfOauthTokenUrl: 'https://login.example.com/oauth/token',
    cfApiHost: 'https://api.example.com',
    proxySiteTable: 'testSiteTable',
    uaaHost: 'https://uaa.example.com',
    uaaHostUrl: 'https://uaa.example.com',
  },
  userEnvVar: {
    key: 'shhhhhhhhhhh',
  },
};
