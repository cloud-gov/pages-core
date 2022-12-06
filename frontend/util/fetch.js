import 'whatwg-fetch';

const defaultMethod = 'GET';
const credentials = 'same-origin';

const defaultHeaders = {
  accept: 'application/json',
  'content-type': 'application/json',
};

function mergeParams(url, params) {
  return Object.keys(params).reduce((memo, param, index) => (
    `${memo}${!index ? '?' : '&'}${param}=${params[param]}`),
  url);
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
    } catch (error) {
      formattedError = errorText;
    }

    const error = new Error(formattedError);
    error.response = response;

    throw error;
  });
}

function parseJSON(response) {
  if (response.status === 204) {
    return response;
  }

  return response.json();
}

function fetchWrapper(url, configs = {}) {
  const baseConfigs = {
    credentials: configs.credentials || credentials,
    headers: { ...defaultHeaders, ...configs.headers || {} },
    method: configs.method || defaultMethod,
  };

  let requestConfigs;

  if (configs.method && !(/get|delete/i).test(configs.method)) {
    requestConfigs = Object.assign(baseConfigs, {}, {
      body: JSON.stringify(configs.data),
    });
  } else {
    requestConfigs = baseConfigs;
  }

  const requestUrl = configs.params ? mergeParams(url, configs.params) : url;

  return fetch(requestUrl, requestConfigs)
    .then(checkStatus)
    .then(parseJSON);
}

export default fetchWrapper;
