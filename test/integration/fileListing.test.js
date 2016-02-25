var assert = require('assert');
var _ = require('underscore');

var FileListingPage = require('./pageobjects/fileListing.page');

var FEDERALIST_TEST_USER = process.env.FEDERALIST_TEST_USER;
var fileListingPage;

describe('generic repository file listing tests', function () {
  this.timeout(15000);

  before(function () {
    var engine = sails.hooks[sails.config.build.engine];
    engine.jekyll = function (model, done) {
      done();
    };
    fileListingPage = new FileListingPage(webdriver);
  });

  after(function () {
    return fileListingPage.end();
  });

  it('logs in', function () {
    this.timeout(20000);
    return fileListingPage.login();
  });

  describe('for a repository', function () {
    var site;
    before(function (done) {
      User.find({ username: FEDERALIST_TEST_USER }).exec(function (err, u) {
        var data = {
          owner: FEDERALIST_TEST_USER,
          repository: 'microsite-template',
          defaultBranch: 'master',
          users: [u[0].id]
        };

        Site.create(data).exec(function (err, s) {
          if (err) throw err;
          site = s;
          fileListingPage.siteId = site.id;
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

    it('opens', function () {
      return fileListingPage.open();
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
          var r = /\master\/pages/;
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
