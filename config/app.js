switch(process.env.APP_ENV){
  case "production":
    homepage = "https://federalist.18f.gov";
    break;
  case "staging":
    homepage = "https://federalist-staging.18f.gov";
    break;
  default: //development
    homepage = "://0.0.0.0:4000";
}

module.exports = {
  hostname: process.env.APP_HOSTNAME || 'http://localhost:1337',
  preview_hostname: process.env.FEDERALIST_PREVIEW_HOSTNAME || 'http://localhost:1338',
  app_env: process.env.APP_ENV || 'development',
  HOMEPAGE_URL: homepage
};
