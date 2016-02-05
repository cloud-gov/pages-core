var assert = require('assert');
var NewSitePage = require('./pageobjects/newSite.page');

var newSitePage;

before(function () {
  this.timeout(8000);
  newSitePage = new NewSitePage(helpers.webdriver.createDriver());
  return newSitePage.init();
});

after(function () {
  return newSitePage.end();
});

describe('new site page integration tests', function () {
  this.timeout(8000);

  it('logs in', function () {
    return newSitePage.login();
  });

  it('opens new site', function () {
    return newSitePage.open();
  });

  it('has form', function () {
    return newSitePage.driver
      .isExisting('form');
  });

  it('prefills github user', function () {
    return newSitePage.getOwner()
      .then(function (owner) {
        assert.ok(owner);
      });
  });

  it('enters non-existent repository name', function () {
    return newSitePage.setRepository('foo');
  });

  it('submits the form', function () {
    return newSitePage.submit();
  });

  it('flashes error', function () {
    return newSitePage
      .flashMessage()
      .then(function (message) {
        assert.equal(message, 'Unable to access the repository');
      });
  });
});
