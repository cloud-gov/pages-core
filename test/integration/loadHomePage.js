var assert = require('assert');
var mocha = require('mocha');
var webdriverio = require('webdriverio');

var options = {
  desiredCapabilities: {
    browserName: 'chrome'
  }
};

var client;

beforeEach(function () {
  client = webdriverio.remote(options);
});

describe('home page integration tests', function () {

  it('should load the unauthenticated homepage', function (done) {
    return client
      .init()
      .url('http://localhost:1337')
      .getTitle().then(function(title) {
        assert.equal(title, 'Federalist');
      })
      .end(done);
  });

  it('should load the authenticated site listing', function () {
    return client
      .init()
      .url('http://localhost:1337')
      .click('[href="/auth/github"]')
      .waitForExist('#login')
      .setValue('#login_field', 'FederalistTestingUser')
      .setValue('#password', process.env.FEDERALIST_TEST_PASSWORD)
      .submitForm('#login_field')
      .waitForExist('.list')
      .execute(function() {
        return window.federalist.user.attributes.username;
      })
      .then(function(username) {
        assert.equal(username.value, 'FederalistTestingUser');
      });
  });

});

// afterEach(function (done) {
//   // client.end(done);
// });
