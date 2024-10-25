const yaml = require('js-yaml');
const validator = require('validator');

const branchRegex = /^[\w.]+(?:[/-]*[\w.])*$/;
const githubUsernameRegex = /^[^-][a-zA-Z-]+$/;
const shaRegex = /^[a-f0-9]{40}$/;
const subdomainRegex = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

class ValidationError extends Error { }

class CustomError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function isValidJSON(json) {
  if (typeof json === 'number') {
    return false;
  }

  try {
    if (typeof json === 'string') {
      const parsed = JSON.parse(json);

      if (typeof parsed !== 'object') {
        throw new Error('Invalid json type');
      }
    }
  } catch {
    return false;
  }
  // if no error, then the string was valid
  return true;
}

function isValidYaml(yamlString) {
  try {
    yaml.load(yamlString);
  } catch {
    // for Sequelize validators, we need to throw an error
    // on invalid values
    throw new Error('input is not valid YAML');
  }
  // if no error, then the string was valid
  return true;
}

function parseSiteConfig(siteConfig, configName = null) {
  let obj = null;

  try {
    if ((typeof siteConfig) === 'string' && siteConfig.length > 0) {
      obj = yaml.load(siteConfig);
    }

    if ((typeof siteConfig) === 'object') { return siteConfig; }
  } catch {
    // on invalid values
    let msg = 'input is not valid YAML';
    if (configName) {
      msg = `${configName}: ${msg}`;
    }

    obj = new Error(msg);
    obj.name = 'InvalidYaml';
    obj.status = 403;
  }
  return obj;
}

function parseSiteConfigs(siteConfigs) {
  let siteConfig;
  const parsedSiteConfigs = {};
  Object.keys(siteConfigs).forEach((configName) => {
    siteConfig = siteConfigs[configName];
    parsedSiteConfigs[configName] = parseSiteConfig(siteConfig.value, siteConfig.label);
  });
  const errorMsgs = [];
  Object.keys(parsedSiteConfigs).forEach((configName) => {
    if (parsedSiteConfigs[configName] && parsedSiteConfigs[configName].status) {
      errorMsgs.push(parsedSiteConfigs[configName].message);
    }
  });

  if (errorMsgs.length > 0) {
    const error = new Error(errorMsgs.join('\n'));
    error.name = 'InvalidYaml';
    error.status = '403';
    throw error;
  }
  return parsedSiteConfigs;
}

function isEmptyOrBranch(value) {
  if (value?.length >= 300) {
    throw new Error('Invalid branch name — branch names are limitted to 299 characters.');
  }

  if (value && value.length && !branchRegex.test(value)) {
    throw new Error('Invalid branch name — branches can only contain alphanumeric characters, underscores, and hyphens.');
  }
}

function isEmptyOrUrl(value) {
  const validUrlOptions = {
    require_protocol: true,
    protocols: ['https'],
  };

  if (value && value.length && !validator.isURL(value, validUrlOptions)) {
    throw new Error('URL must start with https://');
  }
}

function isValidSubdomain(value) {
  const msg = 'Subdomains may only contain up to 63 alphanumeric and hyphen characters.';
  if (!subdomainRegex.test(value)) {
    throw new Error(msg);
  }
}

const validBasicAuthUsername = s => /^(?!.*[:])(?=.*[a-zA-Z0-9]).{4,255}$/.test(s);

const validBasicAuthPassword = s => /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{4,255}$/.test(s);

const isDelimitedFQDN = (str) => {
  const msg = 'must be a comma-separated list of valid fully qualified domain names';
  const isValid = str.split(',').every(s => validator.isFQDN(s));
  if (!isValid) {
    throw new Error(msg);
  }
};

module.exports = {
  branchRegex,
  CustomError,
  shaRegex,
  githubUsernameRegex,
  isValidJSON,
  isValidYaml,
  parseSiteConfig,
  parseSiteConfigs,
  isEmptyOrBranch,
  isEmptyOrUrl,
  ValidationError,
  validBasicAuthUsername,
  validBasicAuthPassword,
  isValidSubdomain,
  isDelimitedFQDN,
};
