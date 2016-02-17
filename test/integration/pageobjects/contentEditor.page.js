/**
 * ContentEditorPage
 *
 * A page object API around the Content Editor page.
 */

var BaseFederalistPage = require('./baseFederalist.page');

var FEDERALIST_TEST_USER = process.env.FEDERALIST_TEST_USER;

function ContentEditorPage () {
  BaseFederalistPage.apply(this, arguments);

  this.url = [
    '/#edit',
    FEDERALIST_TEST_USER,
    'microsite-template',
    'gh-pages'
  ].join('/');
}

ContentEditorPage.prototype = Object.create(BaseFederalistPage.prototype);

ContentEditorPage.prototype.loadAndWait = function (url) {
  return this.open(url)
    .waitForVisible('#edit-content');
};

ContentEditorPage.prototype.openMarkdownFileWithoutYAMLFrontmatter = function () {
  return this.loadAndWait(this.url + '/CONTRIBUTING.md');
};

ContentEditorPage.prototype.openMarkdownFileWithYAMLFrontmatter = function () {
  return this.loadAndWait(this.url + '/pages/example_page.md');
};

ContentEditorPage.prototype.openYAMLFile = function () {
  return this.loadAndWait(this.url + '/_data/meta.yml');
};

ContentEditorPage.prototype.openJavaScriptFile = function () {
  return this.loadAndWait(this.url + '/assets/js/respond.min.js');
};

module.exports = ContentEditorPage;
