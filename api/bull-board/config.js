if (process.env.NODE_ENV === 'production') {
  const cfenv = require('cfenv'); // eslint-disable-line global-require
  const appEnv = cfenv.getAppEnv();

  const redisCreds = appEnv.getServiceCreds(`federalist-${process.env.APP_ENV}-redis`);
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
    hostname: process.env.APP_HOSTNAME || 'http://localhost:1338',
  };

  module.exports.env = {
    uaaHostUrl: process.env.UAA_HOST_DOCKER_URL || process.env.UAA_HOST || 'http://uaa.example.com',
  };
} else {
  module.exports = require('../../config'); // eslint-disable-line global-require
}
