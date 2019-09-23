const yaml = require('js-yaml');

const branchRegex = /^[\w.]+(?:[/-]*[\w.])*$/;
const githubUsernameRegex = /^[^-][a-zA-Z-]+$/;
const shaRegex = /^[a-f0-9]{40}$/;


function parseSiteConfig(siteConfig, configName = null) {

  if (!siteConfig) { return null; }

  let obj = {};

  try {
    if ((typeof siteConfig) === 'string'){
      obj = yaml.safeLoad(siteConfig);
    }

    if ((typeof siteConfig ) === 'object') { return siteConfig; }
  } catch (e) {
    // on invalid values
    let msg = 'input is not valid YAML';
    if (configName) {
      msg = `${configName}: ` + msg;
    }

    obj = new Error(msg);
    obj.name = 'InvalidYaml'
    obj.status = 403;
  }
  return obj;
}

function parseSiteConfigs(siteConfigs) {
  const configs = []
  let siteConfig;
  Object.keys(siteConfigs).forEach((configName) => {
    siteConfig = siteConfigs[configName];
    siteConfigs[configName] = parseSiteConfig(siteConfig.value, siteConfig.label);
  });
  const errorMsgs = [];
  Object.keys(siteConfigs).forEach((configName) => {
    if (siteConfigs[configName] && siteConfigs[configName].status) {
      errorMsgs.push(siteConfigs[configName].message);
    }
  });

  if (errorMsgs.length > 0) {
    const error = new Error(errorMsgs.join('\n'));
    error.name = 'InvalidYaml';
    error.status = '403';
    throw error;
  }
  return siteConfigs;
}

module.exports = {
  branchRegex,
  shaRegex,
  githubUsernameRegex,
  parseSiteConfigs,
};