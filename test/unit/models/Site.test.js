var assert = require('assert'),
    sinon = require('sinon');

describe('Site Model', function() {

  describe('.beforeCreate', function(){
    it('should register site', function(done) {
      var registerSite = Site.registerSite;
      Site.registerSite = sinon.spy(function() {
        assert(Site.registerSite.called);
        Site.registerSite = registerSite;
        done();
      });
      Site.beforeCreate({});
    });
  });

  describe('.registerSite', function(){
    it('should call GitHub.setWebhook', function(done) {
      var setWebhook = GitHub.setWebhook;
      GitHub.setWebhook = sinon.spy(function() {
        assert(GitHub.setWebhook.called);
        GitHub.setWebhook = setWebhook;
        done();
      });
      Site.registerSite({});
    });
  });

});
