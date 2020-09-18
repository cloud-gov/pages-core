const cfenv = require('cfenv');

const loadSiteWideError = () => {
  const appEnv = cfenv.getAppEnv();
  const siteWideErrorEnv = appEnv.getServiceCreds('federalist-site-wide-error');
  if (siteWideErrorEnv && siteWideErrorEnv.HEADING && siteWideErrorEnv.BODY) {
    return {
      heading: siteWideErrorEnv.HEADING,
      body: siteWideErrorEnv.BODY,
    };
  }
  return null;
};

module.exports = { loadSiteWideError };
