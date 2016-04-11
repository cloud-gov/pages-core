/**
 * FileListingPage
 *
 * A page object API around the File Listing page for repos
 * that aren't configured to use the Federalist navigation
 * configuration feature.
 */

var BaseFederalistPage = require('./baseFederalist.page');

var FEDERALIST_TEST_USER = process.env.FEDERALIST_TEST_USER;

function FileListingPage () {
  BaseFederalistPage.apply(this, arguments);
}

FileListingPage.prototype = Object.create(BaseFederalistPage.prototype);

FileListingPage.prototype.urlFromId = function (siteId) {
  return ['/#site', siteId].join('/') + '/';
};

FileListingPage.prototype.load = function () {
  var sel = '.list-group-item';
  var url = this.urlFromId(this.siteId);
  return this.open(url)
    .waitForVisible(sel);
};

FileListingPage.prototype.getListItems = function () {
  var sel = '.list-group-item';
  return this.load()
    .elements(sel);
};

FileListingPage.prototype.clickOpenOnFolder = function () {
  var sel = 'a[href$="pages"]';
  return this.load()
    .click(sel);
};

FileListingPage.prototype.clickOpenOnFile = function () {
  var sel = 'a[href$="README.md"]';
  return this.load()
    .click(sel)
    .waitForVisible('#edit-content');
};

module.exports = FileListingPage;
