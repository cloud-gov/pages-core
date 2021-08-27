module.exports = {
  adminHostname: process.env.ADMIN_HOSTNAME || 'http://localhost:3000',
  hostname: process.env.APP_HOSTNAME || 'http://localhost:1337',
  app_env: process.env.APP_ENV || 'development',
  homepageUrl: process.env.HOMEPAGE_URL || 'http://localhost:4000',
  s3ServicePlanId: process.env.S3_SERVICE_PLAN_ID || 'myFederalistS3BrokerGuid',
  domain: process.env.DOMAIN || 'localhost:1337',
  proxyDomain: process.env.PROXY_DOMAIN || 'localhost:1337',
  product: process.env.PRODUCT || 'pages',
};
