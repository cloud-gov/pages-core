var _ = require('underscore');
var querystring = require('querystring');

module.exports = {
  getOpts: getOpts,
  makeUrl: makeUrl,
  mockResponse: mockResponse
};

/**
 * Get config opts for the 18f/federalist repository
 */
function getOpts(opts) {
  var basic = {
    token: 'FAKETOKEN',
    owner: '18f',
    repoName: 'federalist',
    branch: 'master'
  };
  opts = opts || {};

  return _.extend(basic, opts);
}

/**
 * Makes a consistent GH API URL for the 18f/federalist repository
 * @param {string} path - the path within the repo; defaults to root
 */
function makeUrl(path) {
  var opts = getOpts();
  var qs = {
    'access_token': opts.token,
    ref: opts.branch
  };
  var baseUrl = [
    'https://api.github.com/repos',
    '18f',
    'federalist',
    'contents'
  ];

  if (path) baseUrl.push(path);
  return [baseUrl.join('/'), querystring.stringify(qs)].join('?');
}

/**
 * Makes a consistent mocked HTTP response for Sinon
 * @param {string} data - the body of the response
 * @param {integer} status (optional) - HTTP status code to return
 */
function mockResponse(data, status) {
  status = status || 200;
  var headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };
  var req = [status, headers, data];

  return req;
}
