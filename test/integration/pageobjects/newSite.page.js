/**
 * NewSitePage
 *
 * A page object API around the New Site page.
 */

var BaseFederalistPage = require('./baseFederalist.page');
var NewSiteFromTemplateElement = require('./newSiteFromTemplate.element');

function NewSitePage () {
  BaseFederalistPage.apply(this, arguments);

  this.url = '/#new';
}

NewSitePage.prototype = Object.create(BaseFederalistPage.prototype);

var selectors = NewSitePage.selectors = {
  flashMessage: '.alert-container .new-site-error',
  newSiteForm: 'form.new-site-form',
  templates: '.template-block'
}

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
  return this.driver
    .waitForVisible(selectors.flashMessage)
    .getText(selectors.flashMessage);
};

NewSitePage.prototype.templateElements = function () {
  var driver = this.driver;
  return driver.elements(selectors.templates)
    .then(function (webElements) {
      return webElements.value.map(function (webElement) {
        return new NewSiteFromTemplateElement(driver, webElement.ELEMENT);
      });
    });
};


module.exports = NewSitePage;
