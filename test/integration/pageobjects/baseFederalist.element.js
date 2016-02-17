/**
 * BaseFederalistElement
 *
 * An API to handle WebElement JSON objects by leveraging the [webdriverio
 * protocol methods](http://webdriver.io/api.html). This implements
 * (incomplete) some of the helper methods from webdriverio to make it easier
 * to deal with a single component.
 */


/**
 * @required driver webdriverio instance
 * @required webElementId the webElement ID, ususally webElement.value.ELEMENT from the webdriver protocol methods.
 */
function BaseFederalistElement (driver, webElementId) {
  this.driver = driver;
  this.elementId = webElementId;
}

// Finds the element with selector from the root of this component
BaseFederalistElement.prototype.element = function (selector) {
  return this.driver
    .elementIdElement(this.elementId, selector);
};

// Finds the elements with selector from the root of this component
BaseFederalistElement.prototype.elements = function (selector) {
  return this.driver
    .elementIdElements(this.elementId, selector);
};

BaseFederalistElement.prototype.setValue = function (selector, value) {
  var driver = this.driver;
  return this.element(selector)
    .then(function (webElement) {
      return driver.elementIdValue(webElement.value.ELEMENT, value);
    });
};

BaseFederalistElement.prototype.submitForm = function (selector) {
  var driver = this.driver;
  return this.element(selector)
    .then(function (webElement) {
      return driver.submit(webElement.value.ELEMENT);
    });
};


module.exports = BaseFederalistElement;
