var assert = require('assert');
var mocha = require('mocha');
var sinon = require('sinon');

var mockData = JSON.stringify(require('../../data/repoResponse.json'));
var mockCommitResponse = JSON.stringify(require('../../data/commitResponse.json'));

var Github = require('./../../../../../assets/app/models/Github');
var githubHelpers = require('../../models/githubHelpers');

var PagesView = require('./../../../../../assets/app/views/editor/pages');

var server;

describe('pages view', function () {
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
          new PagesView();
        });
      });
    });

    describe('with a model but without a pages option', function () {
      it('should throw exception', function () {
        assert.throws(function () {
          new PagesView({ model: model });
        });
      });
    });

    describe('with a model and a pages option', function () {
      it('should not throw exception', function () {
        assert.doesNotThrow(function () {
          new PagesView({ model: model, pages: [] });
        });
      });
    });

  });

  afterEach(function () {
    server.restore();
  });
});
