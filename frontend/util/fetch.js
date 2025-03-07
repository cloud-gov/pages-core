const defaultMethod = 'GET';
const credentials = 'same-origin';

const defaultHeaders = {
  accept: 'application/json',
  'content-type': 'application/json',
};

function mergeParams(url, params) {
  return Object.keys(params).reduce(
    (memo, param, index) => `${memo}${!index ? '?' : '&'}${param}=${params[param]}`,
    url,
  );
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
    } catch {
      formattedError = errorText;
    }

    const error = new Error(formattedError);
    error.response = response;

    throw error;
  });
}

function parseJSON(response) {
  if (response.redirected) {
    window.location.href = response.url;
    return {};
  }

  if (response.status === 204) {
    return response;
  }

  return response.json();
}

function fetchWrapper(url, configs = {}) {
  const baseConfigs = {
    credentials: configs.credentials || credentials,
    headers: {
      ...defaultHeaders,
      ...(configs.headers || {}),
    },
    method: configs.method || defaultMethod,
  };

  let requestConfigs;

  let requestBody = JSON.stringify(configs.data);

  if (baseConfigs.headers['content-type'] === 'multipart/form-data') {
    requestBody = configs.body;
    // browser must set this for FormData
    delete baseConfigs.headers['content-type'];
  }
  if (configs.method && !/get|delete/i.test(configs.method)) {
    requestConfigs = Object.assign(
      baseConfigs,
      {},
      {
        body: requestBody,
      },
    );
  } else {
    requestConfigs = baseConfigs;
  }

  const requestUrl = configs.params ? mergeParams(url, configs.params) : url;
  return fetch(requestUrl, requestConfigs).then(checkStatus).then(parseJSON);
}

export default fetchWrapper;
