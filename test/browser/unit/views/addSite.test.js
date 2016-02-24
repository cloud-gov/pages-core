var _ = require('underscore');
var assert = require('assert');
var mocha = require('mocha');

var AddSiteView = require('./../../../../assets/app/views/add');

describe('add sites view', function () {

  beforeEach(function () {

  });

  describe('formatting functions', function () {
    it('should formatGithubSafeRepositoryName()', function () {
      var expected = 'Underscores_are_fine-but-spaces-are-not';
      var badRepoName = 'Underscores_are_fine but spaces are not -';
      var actual = AddSiteView.prototype.formatGithubSafeRepositoryName(badRepoName);

      assert.equal(actual, expected);
    });
  });

  afterEach(function () {

  });

});
