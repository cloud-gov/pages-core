/**
 * FileListingPage
 *
 * A page object API around the New Site page.
 */

var BaseFederalistPage = require('./baseFederalist.page');

function FileListingPage () {
  BaseFederalistPage.apply(this, arguments);

  this.url = '/#edit/FederalistTestingUser/microsite-template/gh-pages';
}

FileListingPage.prototype = Object.create(BaseFederalistPage.prototype);

FileListingPage.prototype.load = function () {
  var sel = '.list-group-item';
  return this.open()
    .waitForVisible(sel);
};

FileListingPage.prototype.getListItems = function () {
  var sel = '.list-group-item';
  return this.load()
    .elements(sel);
};

FileListingPage.prototype.clickOpenOnFolder = function () {
  var sel = 'a[href$=\'/gh-pages/pages\']';
  return this.load()
    .click(sel);
};

FileListingPage.prototype.clickOpenOnFile = function () {
  var sel = 'a[href$=\'/gh-pages/README.md\']';
  return this.load()
    .click(sel)
    .waitForVisible('#edit-content');
};

module.exports = FileListingPage;
