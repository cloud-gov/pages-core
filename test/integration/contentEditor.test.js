var assert = require('assert');
var _ = require('underscore');

var ContentEditorPage = require('./pageobjects/contentEditor.page');

var FEDERALIST_TEST_USER = process.env.FEDERALIST_TEST_USER;
var FEDERALIST_TEST_REPOSITORY = process.env.FEDERALIST_TEST_REPOSITORY;
var contentEditorPage;

describe('content editor integration tests', function () {
  this.timeout(15000);

  before(function () {
    var engine = sails.hooks[sails.config.build.engine];
    engine.jekyll = function (model, done) {
      done();
    };

    contentEditorPage = new ContentEditorPage(webdriver);
  });

  after(function () {
    return contentEditorPage.end();
  });

  it('logs in', function () {
    return contentEditorPage.login();
  });

  it('opens', function () {
    return contentEditorPage.open();
  });

  describe('accesses Github content through editor', function () {
    var site;
    before(function (done) {
      User.find({ username: FEDERALIST_TEST_USER }).exec(function (err, u) {
        var data = {
          owner: FEDERALIST_TEST_USER,
          repository: FEDERALIST_TEST_REPOSITORY,
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

    describe('opens md file without frontmatter', function () {
      it('loads content', function() {
        return contentEditorPage.openMarkdownFileWithoutYAMLFrontmatter();
      });

      it('does not have whitelist field controls', function () {
        return contentEditorPage.openMarkdownFileWithoutYAMLFrontmatter()
          .elements('#whitelist')
          .then(function(els) {
            var length = els.value.length;
            assert.equal(length, 0);
          });
      });
    });

    describe('opens md file with frontmatter', function () {
      it('loads content', function() {
        return contentEditorPage.openMarkdownFileWithYAMLFrontmatter();
      });

      it('does have both sets of field controls', function () {
        return contentEditorPage.openMarkdownFileWithYAMLFrontmatter()
          .elements('#whitelist')
          .then(function(els) {
            var length = els.value.length;
            assert.notEqual(length, 0);
          })
          .elements('#settings')
          .then(function(els) {
            var length = els.value.length;
            assert.notEqual(length, 0);
          });
      });
    });

    describe('opens pure YAML file', function () {
      it('loads content', function() {
        return contentEditorPage.openYAMLFile();
      });

      it('displays a single codemirror', function () {
        return contentEditorPage.openYAMLFile()
          .isVisible('.ProseMirror')
          .then(function(isVisible) {
            assert.equal(isVisible, false);
          })
          .isVisible('.CodeMirror')
          .then(function(isVisible) {
            assert.equal(isVisible, true);
          });
      });
    });

  });
});
