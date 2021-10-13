if (process.env.NODE_ENV === 'production') {
  const cfenv = require('cfenv'); // eslint-disable-line global-require
  const appEnv = cfenv.getAppEnv();

  const { space_name: spaceName } = appEnv.app;

  const servicePrefix = spaceName === 'pages-staging' ? spaceName : `federalist-${process.env.APP_ENV}`;

  const redisCreds = appEnv.getServiceCreds(`${servicePrefix}-redis`);
  if (redisCreds) {
    module.exports.redis = {
      url: redisCreds.uri,
      tls: {},
    };
  } else {
    throw new Error('No Redis credentials found');
  }

  const uaaCredentials = appEnv.getServiceCreds(`app-${process.env.APP_ENV}-uaa-client`);

  module.exports.passport = {
    uaa: {
      options: uaaCredentials,
    },
  };

  module.exports.app = {
    hostname: process.env.APP_HOSTNAME || 'http://localhost:1340',
  };

  module.exports.env = {
    uaaHostUrl: process.env.UAA_HOST_DOCKER_URL || process.env.UAA_HOST || 'http://uaa.example.com',
  };

  module.exports.helmet = {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'script-src': [
          "'self'",
          'fonts.gstatic.com',
          'fonts.googleapis.com',
        ],
      },
    },
    frameguard: {
      action: 'deny',
    },
    xssFilter: false,
  };

  module.exports.log = {
    level: process.env.LOG_LEVEL || 'info',
  };
} else {
  module.exports = require('../../config'); // eslint-disable-line global-require
}
