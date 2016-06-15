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

function _fetch(url, params = {}) {
  const baseConfigs = {
    credentials: params.credentials || credentials,
    headers: Object.assign({}, defaultHeaders, params.headers || {}),
    method: params.method || defaultMethod
  };

  let requestConfigs;
  let requestUrl;

  if (params.method && !(/get/i).test(params.method)) {
    requestConfigs = Object.assign(baseConfigs, {}, {data: params.data});
  } else {
    requestConfigs = baseConfigs;
  }

  requestUrl = params.params ? mergeParams(url, params) : url;

  return fetch(requestUrl, requestConfigs)
    .then(checkStatus)
    .then(parseJSON);
}

export default _fetch
