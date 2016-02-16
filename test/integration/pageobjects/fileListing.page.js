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

FileListingPage.prototype.getListItems = function () {
  var sel = '.list-group-item';
  return this.driver
    .waitForVisible(sel)
    .elements(sel);
};

FileListingPage.prototype.clickOpenOnFolder = function () {
  var sel = "$('[href^=\"#edit/jeremiak/microsite-template/gh-pages/pages\"]')";
  return this.driver.click(sel);
};

module.exports = FileListingPage;
