const cfenv = require('cfenv');


const loadSiteWideError = () => {
  const appEnv = cfenv.getAppEnv();
  const siteWideErrorEnv = appEnv.getServiceCreds('federalist-site-wide-error');
  if (siteWideErrorEnv) {
    return {
      display: siteWideErrorEnv.DISPLAY,
      heading: siteWideErrorEnv.HEADING,
      body: siteWideErrorEnv.BODY,
    };
  }
  return { display: false, heading: '', body: '' };
};

module.exports = { loadSiteWideError };
