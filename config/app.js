module.exports = {
  hostname: process.env.APP_HOSTNAME || 'http://localhost:1337',
  preview_hostname: process.env.FEDERALIST_PREVIEW_HOSTNAME || 'http://localhost:1338',
  app_env: process.env.APP_ENV || 'development',
  homepageUrl: process.env.HOMEPAGE_URL || 'http://localhost:4000',
  federalistS3BrokerGuid: process.env.FEDERALIST_S3_BROKER_GUID || 'myFederalistS3BrokerGuid',
};
