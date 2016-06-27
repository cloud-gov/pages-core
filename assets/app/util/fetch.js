import 'whatwg-fetch';

const defaultMethod = 'GET';
const credentials = 'same-origin';
const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

function mergeParams(url, params) {
  return Object.keys(params).reduce((memo, param, index) => {
    memo += ((!index ? '?' : '&') + `${param}=${params[param]}`);

    return memo;
  }, url);
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    var error = new Error(response.statusText);
    error.response = response;

    throw error;
  }
}

function parseJSON(response) {
  return response.json();
}

function _fetch(url, configs = {}) {
  const baseConfigs = {
    credentials: configs.credentials || credentials,
    headers: Object.assign({}, defaultHeaders, configs.headers || {}),
    method: configs.method || defaultMethod
  };

  let requestConfigs;
  let requestUrl;

  if (configs.method && !(/get/i).test(configs.method)) {
    requestConfigs = Object.assign(baseConfigs, {}, {data: configs.data});
  } else {
    requestConfigs = baseConfigs;
  }

  requestUrl = configs.params ? mergeParams(url, configs.params) : url;

  return fetch(requestUrl, requestConfigs)
    .then(checkStatus)
    .then(parseJSON);
}

export default _fetch
