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
  if (response.ok) {
    return response;
  }

  // All API error responses are returned as plain text
  return response.text().then((errorText) => {
    let formattedError;

    try {
      formattedError = JSON.parse(errorText).message;
    } catch(error) {
      formattedError = errorText;
    }

    const error = new Error(formattedError);
    error.response = response;

    throw error;
  });
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
    requestConfigs = Object.assign(baseConfigs, {}, {
      body: JSON.stringify(configs.data)
    });
  } else {
    requestConfigs = baseConfigs;
  }

  requestUrl = configs.params ? mergeParams(url, configs.params) : url;

  return fetch(requestUrl, requestConfigs)
    .then(checkStatus)
    .then(parseJSON);
}

export default _fetch
