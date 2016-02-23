var assert = require('assert');
var mocha = require('mocha');
var sinon = require('sinon');

var mockData = JSON.stringify(require('../../data/repoResponse.json'));
var mockCommitResponse = JSON.stringify(require('../../data/commitResponse.json'));

var Github = require('./../../../../assets/app/models/Github');
var githubHelpers = require('../../models/githubHelpers');

var BreadcrumbView = require('./../../../../assets/app/views/editor/breadcrumb');

var server;

describe('breadcrumb view', function () {
  var model;

  beforeEach(function () {
    var opts;

    server = sinon.fakeServer.create();
    sinon.xhr.supportsCORS = true;

    model = new Github(githubHelpers.getOpts());
    server.respondWith('GET', githubHelpers.makeUrl(), githubHelpers.mockResponse(mockData));
    server.respond();
  })

  describe('when view is initialized', function () {
    describe('without model', function () {
      it('should throw exception', function () {
        assert.throws(function () {
          new BreadcrumbView();
        });
      });
    });

    describe('with a model', function () {
      it('should not throw exception', function () {
        assert.doesNotThrow(function () {
          new BreadcrumbView({ model: model });
        });
      });
    });

  });

  afterEach(function () {
    server.restore();
  });
});
