

var _ = require('underscore');
var assert = require('assert');
var mocha = require('mocha');

var SettingsView = require('./../../../../../assets/app/views/site/settings');

describe('logs view', function () {

  beforeEach(function () {

  });

  describe('formatFormData()', function () {
    it('should map properly', function () {
      var serializedArray = [
        {"name":"defaultBranch", "value":"gh-pages"},
        {"name":"publicPreview", "value":"true"},
        {"name":"domain", "value":""},
        {"name":"config", "value":""}
      ];
      var actual = SettingsView.prototype.formatFormData(serializedArray);
      assert.equal(actual.defaultBranch, 'gh-pages');
      assert.equal(actual.publicPreview, 'true');
      assert.notEqual(actual.fake, true);
    });
  });

  afterEach(function () {

  });

});
