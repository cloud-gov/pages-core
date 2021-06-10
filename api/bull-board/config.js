if (process.env.NODE_ENV === 'production') {
  const cfenv = require('cfenv');

  const appEnv = cfenv.getAppEnv();

  const rdsCreds = appEnv.getServiceCreds(`federalist-${process.env.APP_ENV}-rds`);
  if (rdsCreds) {
    module.exports.postgres = {
      database: rdsCreds.db_name,
      host: rdsCreds.host,
      user: rdsCreds.username,
      password: rdsCreds.password,
      port: rdsCreds.port,
    };
  } else {
    throw new Error('No database credentials found.');
  }

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

} else {
  module.exports = require('../../config');
}
