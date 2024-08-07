/* eslint-disable object-curly-newline */
/* eslint-disable object-curly-newline */
const fs = require('fs');
const path = require('path');
const inflection = require('inflection');
const moment = require('moment');

const config = require('../../config');
const { logger } = require('../../winston');

/**
 * @param {string[]} values The enum values
 * @returns
 * An object contained capitalized constants for each value and a `values` key
 * returning the list of values. All values or lowercase.
 *
 * Ex.
 * ```
 * > buildEnum(['created', 'pending'])
 * > {
 *     Created: 'created',
 *     Pending: 'pending',
 *     values: ['created', 'pending]
 *   }
 * ```
 */
function buildEnum(values) {
  const lowerCaseValues = values.map(value => value.toLowerCase());

  const constants = lowerCaseValues.reduce(
    (acc, value) => ({
      ...acc,
      [inflection.capitalize(value)]: value,
    }),
    {}
  );

  return {
    ...constants,
    values: lowerCaseValues,
  };
}

function generateS3ServiceName(owner, repository) {
  if (!owner || !repository) return undefined;

  const format = str => str.toString().toLowerCase().split(' ').join('-');

  const serviceName = `o-${format(owner)}-r-${format(repository)}`;

  if (serviceName.length < 47) {
    return serviceName;
  }

  function makeId() {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < 6; i += 1) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  return `${serviceName.slice(0, 39)}-${makeId()}`;
}

function toSubdomainPart(str) {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let subdomain = str
    // replace all invalid chars with '-'
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    // remove leading and trailing '-'
    .replace(/(^[-]+|[-]+$)/g, '')
    // replace multiple sequential '-' with a single '-'
    .replace(/[-]{2,}/g, '-')
    .substring(0, 62)
    .toLowerCase();

  // pretty arbitrary, but require it is at least 2 chars
  if (subdomain.length < 2) {
    // If we generate parts, make it longer
    while (subdomain.length < 5) {
      subdomain
        += characters[Math.floor(Math.random() * Math.floor(characters.length))];
    }
  }
  return subdomain;
}

function generateSubdomain(owner, repository) {
  if (!owner || !repository) return null;
  return `${toSubdomainPart(owner)}--${toSubdomainPart(repository)}`;
}

function isPastAuthThreshold(authDate) {
  return moment().isAfter(
    moment(authDate).add(config.policies.authRevalidationMinutes, 'minutes')
  );
}

function getDirectoryFiles(dir, existingFileList) {
  let fileList = existingFileList || [];
  fs.readdirSync(dir).forEach((file) => {
    fileList = fs.statSync(path.join(dir, file)).isDirectory()
      ? getDirectoryFiles(path.join(dir, file), fileList)
      : fileList.concat(path.join(dir, file));
  });
  return fileList;
}

function loadDevelopmentManifest() {
  const webpackConfig = require('../../webpack.development.config.js'); // eslint-disable-line global-require,import/extensions
  const { publicPath } = webpackConfig.output;
  const jsFiles = {};

  // eslint-disable-next-line array-callback-return
  Object.keys(webpackConfig.entry).map((key) => {
    const file = `${key}.js`;
    jsFiles[file] = `${publicPath}${file}`;
  });

  // This requires that MiniCssExtractPlugin be the first plugin in the
  // development configuration!!!!!
  const cssFilename = webpackConfig.plugins[0].options.filename;

  return {
    ...jsFiles,
    'bundle.css': `${publicPath}${cssFilename}`,
  };
}

function loadProductionManifest() {
  const manifestFile = 'webpack-manifest.json';
  if (!fs.existsSync(manifestFile)) {
    const msg = 'webpack-manifest.json does not exist. Have you run webpack (`yarn build`)?';
    logger.error(msg);
    throw new Error(msg);
  }
  return JSON.parse(fs.readFileSync(manifestFile, 'utf-8'));
}

function loadAssetManifest() {
  return process.env.NODE_ENV === 'development'
    ? loadDevelopmentManifest()
    : loadProductionManifest();
}

function getSiteDisplayEnv() {
  if (config.app.appEnv !== 'production') {
    return config.app.appEnv;
  }
  return null;
}

function shouldIncludeTracking() {
  return config.app.appEnv === 'production';
}

function mapValues(fn, obj) {
  const reducer = (acc, key) => {
    acc[key] = fn(obj[key]);
    return acc;
  };
  return Object.keys(obj).reduce(reducer, {});
}

function wrapHandler(fn) {
  return (req, res, next) => fn(req, res).catch(next);
}

function wrapHandlers(handlers) {
  return mapValues(wrapHandler, handlers);
}

function pick(keys, obj) {
  const objKeys = Object.keys(obj);
  return keys.reduce((picked, key) => {
    if (objKeys.includes(key)) {
      picked[key] = obj[key]; // eslint-disable-line no-param-reassign
    }
    return picked;
  }, {});
}

function omit(keys, obj) {
  const pickedKeys = Object.keys(obj).filter(key => !keys.includes(key));
  return pick(pickedKeys, obj);
}

function toInt(val) {
  const result = /^\d+$/.exec(val);
  return result ? parseInt(result[0], 10) : null;
}

function wait(time = 500) {
  return new Promise(r => setTimeout(r, time));
}

function omitBy(fn, obj) {
  const pickedKeys = Object.keys(obj).filter(key => !fn(obj[key], key));

  return pick(pickedKeys, obj);
}

async function paginate(model, serialize, params, query = {}) {
  const limit = toInt(params.limit) || 25;
  const page = toInt(params.page) || 1;
  const offset = limit * (page - 1);

  const pQuery = {
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    ...query,
  };

  const { rows, count } = await model.findAndCountAll(pQuery);

  const totalPages = Math.trunc(count / limit) + (count % limit === 0 ? 0 : 1);

  // The serialize funtion may or may not be a promise
  const data = await Promise.resolve(serialize(rows));

  return {
    currentPage: page,
    totalPages,
    totalItems: count,
    data,
  };
}

function defaultContext(req, res) {
  const messages = {
    errors: req.flash('error'),
  };

  return {
    isAuthenticated: false,
    messages,
    shouldIncludeTracking: shouldIncludeTracking(),
    siteDisplayEnv: getSiteDisplayEnv(),
    homepageUrl: config.app.homepageUrl,
    webpackAssets: loadAssetManifest(),
    hasUAAIdentity: false,
    nonce: res.locals.cspNonce,
    isPages: process.env.PRODUCT === 'pages',
    supportEmail: config.app.supportEmail,
    productName: process.env.PRODUCT,
    appName: config.app.appName,
  };
}

function truncateString(s, characters = 30) {
  if (s.length > characters) {
    return `${s.substring(0, characters)}...`;
  }

  return s;
}

const DEFAULT_BUILD_TASK_PARAMS = '-p \'{ "STATUS_CALLBACK": "{{job.data.STATUS_CALLBACK}}", "TASK_ID": {{job.data.TASK_ID}}, "AWS_DEFAULT_REGION": "{{job.data.AWS_DEFAULT_REGION}}", "AWS_ACCESS_KEY_ID": "{{job.data.AWS_ACCESS_KEY_ID}}", "AWS_SECRET_ACCESS_KEY": "{{job.data.AWS_SECRET_ACCESS_KEY}}", "BUCKET": "{{job.data.BUCKET}}" }\'';

const DEFAULT_SCAN_RULES = {
  'owasp-zap': [
    { id: '10038', source: 'Pages' },
    { id: '10045', source: 'Pages' },
    { id: '10063', source: 'Pages' },
    { id: '10098', source: 'Pages' },
    { id: '10099', source: 'Pages' },
    { id: '90004', source: 'Pages' },
    { id: '10202', match: ['search_form'], source: 'Pages' },
    { id: '10097', match: ['/assets/styles'], source: 'Pages' },
  ],
  a11y: [],
};

function appMatch(type) {
  // get a readable string from a BuildTaskType appName to match the scan rule types
  return type.metadata.appName.replace(/pages-(.*)-task-.*/, '$1');
}

module.exports = {
  appMatch,
  buildEnum,
  generateS3ServiceName,
  generateSubdomain,
  getDirectoryFiles,
  getSiteDisplayEnv,
  isPastAuthThreshold,
  loadAssetManifest,
  loadDevelopmentManifest,
  loadProductionManifest,
  mapValues,
  omitBy,
  omit,
  paginate,
  pick,
  shouldIncludeTracking,
  toInt,
  toSubdomainPart,
  truncateString,
  wait,
  wrapHandler,
  wrapHandlers,
  defaultContext,
  DEFAULT_BUILD_TASK_PARAMS,
  DEFAULT_SCAN_RULES,
};
