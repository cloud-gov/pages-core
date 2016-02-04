var assert = require('assert');
var mocha = require('mocha');
var webdriverio = require('webdriverio');

var options = {
  'desiredCapabilities': {
    'browserName': 'chrome'
  },
  'user': process.env.SAUCE_USERNAME,
  'key': process.env.SAUCE_ACCESS_KEY,
  'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
  'name': 'integration',
  'baseUrl': 'http://localhost:1337',
  'waitforTimeout': 1000
};

var client;

beforeEach(function (done) {
  this.timeout(8000);
  client = webdriverio.remote(options);
  client.init(done);
});

describe('home page integration tests', function () {
  this.timeout(8000);

  it('should load the unauthenticated homepage', function () {
    return client
      .url('http://localhost:1337')
      .getTitle().then(function(title) {
        assert.equal(title, 'Federalist');
      })
  });

  it('has FEDERALIST_TEST_* set', function () {
      assert.ok(process.env.FEDERALIST_TEST_PASSWORD, 'You must set the github test user password in FEDERALIST_TEST_PASSWORD.')
      assert.ok(process.env.FEDERALIST_TEST_USER, 'You must set the github test user in FEDERALIST_TEST_USER.')
  });

  it('should load the authenticated site listing', function () {
    return client
      .url('http://localhost:1337')
      .click('[href="/auth/github"]')
      .waitForExist('#login')
      .setValue('#login_field', process.env.FEDERALIST_TEST_USER)
      .setValue('#password', process.env.FEDERALIST_TEST_PASSWORD)
      .submitForm('#login_field')
      .waitForExist('.list')
      .execute(function() {
        return window.federalist.user.attributes.username;
      })
      .then(function(username) {
        assert.equal(username.value, process.env.FEDERALIST_TEST_USER);
      });
  });

});

afterEach(function (done) {
  client.end(done);
});
