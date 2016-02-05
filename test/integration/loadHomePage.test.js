var assert = require('assert');
var mocha = require('mocha');
var webdriverio = require('webdriverio');
var HomePage = require('./pageobjects/home.page');

var homePage;

before(function () {
  this.timeout(8000);
  homePage = new HomePage(helpers.webdriver.createDriver());
  return homePage.init();
});

after(function () {
  return homePage.end();
});

describe('home page integration tests', function () {
  this.timeout(8000);

  it('loads the homepage', function () {
    return homePage.driver.url('/');
  });

  it('has a title', function () {
    return homePage.driver
      .getTitle()
      .then(function(title) {
        assert.equal(title, 'Federalist');
      });
  });

  it('has FEDERALIST_TEST_* set', function () {
      assert.ok(process.env.FEDERALIST_TEST_PASSWORD, 'You must set the github test user password in FEDERALIST_TEST_PASSWORD.')
      assert.ok(process.env.FEDERALIST_TEST_USER, 'You must set the github test user in FEDERALIST_TEST_USER.')
  });

  it('logs in', function () {
    return homePage.login(process.env.FEDERALIST_TEST_USER, process.env.FEDERALIST_TEST_PASSWORD);
  });

  it('has a user object', function () {
    return homePage.driver
      .execute(function() {
        return window.federalist.user.attributes.username;
      })
      .then(function(username) {
        assert.equal(username.value, process.env.FEDERALIST_TEST_USER);
      });
  });
});
