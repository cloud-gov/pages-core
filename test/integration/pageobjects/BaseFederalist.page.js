/**
 * BaseFederalistPage
 *
 * Page object to provide an API for common actions on most Federalist web pages.
 */

var webdriverio = require('webdriverio');

function BaseFederalistPage(driver) {
  if (!driver) {
    throw new Error('You must pass an instance of a webdriverio client.');
  }

  this.driver = driver;
}

BaseFederalistPage.prototype.open = function (url) {
  return this.driver.url(url);
};

BaseFederalistPage.prototype.init = function () {
  return this.driver.init();
};

BaseFederalistPage.prototype.end = function () {
  return this.driver.end();
};

BaseFederalistPage.prototype.login = function (user, password) {
  return this.driver
    .url('/')
    .click('[href="/auth/github"]')
    .waitForExist('#login')
    .setValue('#login_field', process.env.FEDERALIST_TEST_USER)
    .setValue('#password', process.env.FEDERALIST_TEST_PASSWORD)
    .submitForm('#login_field')
    .waitForExist('.list');
};

module.exports = BaseFederalistPage;
