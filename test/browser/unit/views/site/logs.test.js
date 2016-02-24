var _ = require('underscore');
var assert = require('assert');
var mocha = require('mocha');

var LogsView = require('./../../../../../assets/app/views/site/logs');

describe('logs view', function () {

  beforeEach(function () {

  });

  describe('formats build objects', function () {
    it('should properly format a successful build', function () {
      var build = {
        branch: "master",
        completedAt: "2016-02-22T17:21:22.000Z",
        createdAt: "2016-02-22T17:21:14.000Z",
        error: '',
        id: 1,
        site: 1,
        source: null,
        state: "success",
        updatedAt: "2016-02-22T17:21:22.000Z",
        user: 1
      };
      var actual = LogsView.prototype.formatBuild(build, { 1: 'User' });
      assert.equal(actual.error, '');
      assert.equal(actual.username, 'User');
    });

    it('should properly format an errored build', function () {
      var expectedError = 'Error!';
      var build = {
        branch: "master",
        completedAt: "2016-02-22T17:21:22.000Z",
        createdAt: "2016-02-22T17:21:14.000Z",
        error: "Error!",
        id: 1,
        site: 1,
        source: null,
        state: "error",
        updatedAt: "2016-02-22T17:21:22.000Z",
        user: 1
      };
      var actual = LogsView.prototype.formatBuild(build, { 1: 'User' });
      assert.equal(actual.error, expectedError);
    });
  });

  afterEach(function () {

  });

});
