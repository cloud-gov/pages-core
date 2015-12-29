var assert = require('assert');
var mocha = require('mocha');
var querystring = require('querystring');
var sinon = require('sinon');

var helpers = require('./githubHelpers');

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
    var github = new Github(helpers.getOpts());

    server.respondWith('GET', helpers.makeUrl(), helpers.mockResponse(mockData));
    server.respond();

    assert.equal(github.get('owner'), '18f');
  });

  it('should add a page', function (done) {
    var github = new Github(helpers.getOpts());

    server.respondWith('GET', helpers.makeUrl(), helpers.mockResponse(mockData));
    server.respond();

    var commitOpts = {
      path: 'test.md',
      message: 'Testing add page',
      content: 'yo'
    };

    github.once('github:commit:error', function (e){
      assert.equal(true, false); // if model throws an error fail test
      done();
    });

    github.once('github:commit:success', function (e){
      assert.equal(true, true); // if success event is triggered pass test
      done();
    });

    github.commit(commitOpts);
    server.respondWith('PUT', helpers.makeUrl('test.md'), helpers.mockResponse(mockCommitResponse, 201));
    server.respond();
  });

});

afterEach(function () {
  server.restore();
});
