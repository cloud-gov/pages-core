/**
 * NewSitePage
 *
 * A page object API around the New Site page.
 */

var BaseFederalistPage = require('./baseFederalist.page');

function NewSitePage () {
  BaseFederalistPage.apply(this, arguments);

  this.url = '/#new';
}

NewSitePage.prototype = Object.create(BaseFederalistPage.prototype);

NewSitePage.prototype.getOwner = function () {
  return this.driver.getValue('#owner');
};

NewSitePage.prototype.setOwner = function (owner) {
  return this.driver.setValue('#owner', owner);
};

NewSitePage.prototype.getRepository = function () {
  return this.driver.getValue('#repository');
};

NewSitePage.prototype.setRepository = function (repository) {
  return this.driver.setValue('#repository', repository);
};

NewSitePage.prototype.cancel = function () {
  return this.driver.click('form a[text=Cancel]');
};

NewSitePage.prototype.submit = function () {
  return this.driver.click('form a[type=submit]');
};

NewSitePage.prototype.flashMessage = function () {
  var flashMessageSelector = '.alert-container .new-site-error';
  return this.driver
    .waitForVisible(flashMessageSelector)
    .getText(flashMessageSelector);
};

module.exports = NewSitePage;
