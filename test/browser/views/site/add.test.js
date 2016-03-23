var assert = require('assert');
var mocha = require('mocha');

var AddSiteView = require('./../../../../assets/app/views/add');

describe('add site view', function () {
  var view;

  beforeEach(function () {
    var opts = {
      user: {}
    };
    view = new AddSiteView(opts);
  });

  afterEach(function () {
    view = false;
  });

  describe('displays valuable error messages when adding a site', function () {
    it('without proper github privledges', function () {
      var expected = 'You do not have admin access to this repository';
      var error = {
        responseJSON: {
          raw: expected
        }
      };

      assert.equal(view.formatErrorMessage(error), expected);
    });

    it('if the site is already added', function () {
      var expected = 'You have already added this site to Federalist';
      var error = {
        responseText: expected
      };

      assert.equal(view.formatErrorMessage(error), expected);
    });

    it('if the site name is already used', function () {
      var expected = 'We encountered an error while making your website: name already exists on this account';
      var error = {
        responseJSON: {
          errors: [{
            message: 'name already exists on this account'
          }]
        }
      };

      assert.equal(view.formatErrorMessage(error), expected);
    });
  });

});
