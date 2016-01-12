var assert = require('assert');
var mocha = require('mocha');
var sinon = require('sinon');

var mockData = JSON.stringify(require('../../data/repoResponse.json'));

var Github = require('./../../../../../assets/app/models/Github');
var githubHelpers = require('../../models/githubHelpers');

var FilesView = require('./../../../../../assets/app/views/editor/files');

var server;

describe('files view', function () {
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
          new FilesView();
        });
      });
    });

    describe('with a model', function () {
      it('should not throw exception', function () {
        assert.doesNotThrow(function () {
          new FilesView({ model: model });
        });
      });
    });
  });

  describe('when view methods are called', function () {
    describe('link()', function () {
      it('should link to github for certain files', function () {
        var r = /(github.com.+)/,
            view = new FilesView({ model: model }),
            link = view.link({
              type: 'file',
              path: 'index.html',
              name: 'index.html'
            }),
            match = link.match(r);

        assert(match);
      });

      it('should link to the editor for .md files', function () {
        var r = /(github.com.+)/,
            view = new FilesView({ model: model }),
            link = view.link({
              type: 'file',
              path: 'README.md',
              name: 'README.md'
            }),
            match = link.match(r);

        assert.equal(match, null);
      });

      it('should link to itself for folders', function () {
        var r = /#edit/,
            view = new FilesView({ model: model }),
            link = view.link({
              type: 'folder',
              path: 'pages',
              name: 'pages'
            }),
            match = link.match(r);

        assert(match);
      });

    });
  });

    afterEach(function () {
      server.restore();
    });

});
