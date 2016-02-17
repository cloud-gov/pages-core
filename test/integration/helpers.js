/*
 * helpers
 *
 * Test helper functions.
 */

var _ = require('underscore');
var webdriverio = require('webdriverio');

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
  }
};
