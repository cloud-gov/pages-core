/*
 * helpers
 *
 * Test helper functions.
 */

var _ = require('underscore');
var webdriverio = require('webdriverio');
var Promise = require('bluebird');

module.exports.webdriver = {
  createDriver: function (options) {
    return webdriverio.remote(_.extend({
        'desiredCapabilities': {
          'browserName': 'chrome',
          'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
          'name': 'integration',
          'build': process.env.TRAVIS_BUILD_NUMBER
        },
        'user': process.env.SAUCE_USERNAME,
        'key': process.env.SAUCE_ACCESS_KEY,
        'baseUrl': 'http://localhost:1337',
        'waitforTimeout': 10000
      },
      options || {}
    ));
  },
  clearSession: function () {
    // If there's no webdriver initialized, there's nothing to cleanup
    if (!webdriver) {
      return Promise.reject(new Error('webdriver was never initialized.'));
    }

    return webdriver
      .deleteCookie()
      .localStorage('DELETE')
      .sessionStorage('DELETE')
      //TODO we can alternatively remove the login step from each test suite,
      //we should work toward a better test auth strategy to avoid github.
      // Log out from github
      .url('https://github.com/logout')
      .waitForVisible('input[type="submit"]')
      .click('input[type="submit"]')
      .url('/');
  }
};
