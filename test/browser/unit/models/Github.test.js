var assert = require('assert');
var mocha = require('mocha');
var querystring = require('querystring');
var sinon = require('sinon');

var mockData = JSON.stringify(require('../data/repoResponse.json'));
var mockCommitResponse = JSON.stringify(require('../data/commitResponse.json'));

var Github = require('./../../../../assets/app/models/Github');

var server;

beforeEach(function () {
  server = sinon.fakeServer.create();
  sinon.xhr.supportsCORS = true;
});

describe('Github model', function () {
  it('does not create without a token', function () {
    assert.throws(function() {
      new Github({});
    });
  });

  it('should create with token and repo', function () {
    var github = new Github(getOpts());

    server.respondWith('GET', makeUrl(), mockResponse(mockData));
    server.respond();

    assert.equal(github.get('owner'), '18f');
  });

  it('should add a page', function (done) {
    var github = new Github(getOpts());

    server.respondWith('GET', makeUrl(), mockResponse(mockData));
    server.respond();

    var commitOpts = {
      path: 'test.md',
      message: 'Testing add page'
    };

    github.once('github:commit:error', function (e){
      assert.equal(true, false); // if model throws an error fail test
      done();
    });

    github.once('github:commit:success', function (e){
      assert.equal(true, true); // if success event is triggered pass test
      done();
    });

    github.addPage(commitOpts);
    server.respondWith('PUT', makeUrl('test.md'), mockResponse(mockCommitResponse, 201));
    server.respond();
  });

});

afterEach(function () {
  server.restore();
});

/**
 * Get config opts for the 18f/federalist repository
 */
function getOpts() {
  var opts = {
    token: 'FAKETOKEN',
    owner: '18f',
    repoName: 'federalist',
    branch: 'master'
  };

  return opts;
}

/**
 * Makes a consistent GH API URL for the 18f/federalist repository
 * @param {string} path - the path within the repo; defaults to root
 */
function makeUrl(path) {
  var opts = getOpts();
  var qs = {
    'access_token': opts.token,
    ref: opts.branch,
    z: 6543
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
