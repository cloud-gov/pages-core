var assert = require('assert');
var mocha = require('mocha');
var querystring = require('querystring');
var sinon = require('sinon');
var async = require('async');

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
    server.respondWith('PUT', makeUrl('test.md'), mockResponse(mockCommitResponse, 201));
    server.respond();
  });

  it('should format URLs correctly', function(done) {
    var root = 'https://api.github.com/',
        github = new Github(getOpts());

    function url(o) { return github.url(o).replace(root, '').split('?')[0]; }

    // content URL with path
    assert.equal('repos/18f/federalist/contents/test.md', url({ path: 'test.md' }));

    // root repo URL
    assert.equal('repos/18f/federalist', url({ root: true }));

    // user/repo URL (non-repo route)
    assert.equal('user/repos', url({ route: 'user', method: 'repos' }));

    // change owner and repo
    assert.equal('repos/own/repo', url({
      root: true,
      owner: 'own',
      repository: 'repo'
    }));

    done();
  });

  it('should clone a repository', function(done) {
    server.restore();
    var github = new Github(getOpts());

    // validate function call
    async.series([
      function(done) {
        github.clone(null, null, function(err) { assert(err); done(); });
      },
      function(done) {
        github.clone({ owner: '' }, '', function(err) {
          assert(err);
          done();
        });
      },
      function(done) {
        github.clone({ owner: '', repository: '' }, '', function(err) {
          assert(err);
          done();
        });
      },
      checkSource,
      createRepo,
      //cloneSite
    ], done);

    function checkSource(done) {

      // test method.checkSource
      async.series([

        // Should fail for unavailable repo
        function(done) {
          var source = { owner: '18f', repository: 'federalist-none' },
              destination = 'test-repo';

          github.clone(source, destination);

          github.clone.checkSource(function(err, res) {
            assert(err);
            done();
          });
        },

        // Should pass for available repo
        function(done) {
          var source = { owner: '18f', repository: 'federalist' },
              destination = 'test-repo';

          github.clone(source, destination);

          github.clone.checkSource(function(err, res) {
            assert.ifError(err);
            assert(res);
            assert(res.permissions.pull);
            done();
          });
        }
      ], done);
    }

    function createRepo(done) {

      // test method.createRepo
      var source = { owner: '18f', repository: 'federalist-none' },
          destination = 'test-repo-auto';

      github.clone(source, destination);

      github.clone.createRepo(function(err, res) {
        assert.ifError(err);
        assert(res);
        assert.equal(res.status, 201);
        done();
      });

    }

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
