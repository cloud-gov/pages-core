var assert = require('assert');
var _ = require('underscore');

var FileListingPage = require('./pageobjects/fileListing.page');

var fileListingPage;

describe('generic repository file listing tests', function () {
  this.timeout(15000);

  before(function () {
    var engine = sails.hooks[sails.config.build.engine];
    engine.jekyll = function (model, done) {
      done();
    };
    fileListingPage = new FileListingPage(helpers.webdriver.createDriver());

    return fileListingPage.init();
  });

  after(function () {
    return fileListingPage.end();
  });

  it('logs in', function () {
    return fileListingPage.login();
  });

  it('opens', function () {
    return fileListingPage.open();
  });

  describe('for a repository', function () {
    var site;
    before(function (done) {
      User.find({ username: 'FederalistTestingUser' }).exec(function (err, u) {
        var data = {
          owner: 'FederalistTestingUser',
          repository: 'microsite-template',
          users: [u[0].id]
        };

        Site.create(data).exec(function (err, s) {
          if (err) throw err;
          site = s;
          done();
        });
      });
    });

    after(function (done) {
      Site.destroy({ id: site.id }).exec(function(err){
        if (err) throw err;
        done();
      });
    });

    it('loads the listing', function () {
      return fileListingPage.getListItems()
        .then(function (listItems) {
          var listLength = listItems.value.length;
          assert.notEqual(listLength, 0);
        });
    });

    it('clicks on folder button and loads new directory', function () {
      return fileListingPage.clickOpenOnFolder()
        .then(function () {
          return fileListingPage.driver.url();
        })
        .then(function(url){
          var r = /\/microsite-template\/gh-pages\/pages/;
          assert(url.value.match(r));
        });
    });

    it('clicks on file button to access editor', function () {
      return fileListingPage.clickOpenOnFile()
        .then(function () {
          return fileListingPage.driver.element('#edit-content');
        })
        .then(function (el) {
          assert(el);
        });
    });

  });
});
