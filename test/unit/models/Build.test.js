var assert = require('assert'),
    sinon = require('sinon');

describe('Build Model', function() {

  describe('.afterCreate', function() {
    it('should add job to queue', function(done) {
      sinon.spy(Build, 'addJob');
      Build.afterCreate({ id: 1 }, function() {
        Build.addJob.restore();
        done();
      });
    });
  });

  describe('.queue', function() {
    it('should be an async queue', function(done) {
      assert.equal(Build.queue.tasks.length, 0);
      done();
    });
  });

  describe('.addJob', function() {
    it('should add job to queue', function(done) {
      sinon.spy(Build.queue, 'push');
      Build.addJob({ id: 1, site: { engine: 'jekyll' }, user: {}});
      Build.queue.push.restore();
      done();
    });
  });

  describe('.completeJob', function() {
    it('should save updated model', function(done) {
      var findOne = Build.findOne;
      Build.findOne = sinon.spy(function() {
        assert(Build.findOne.called);
        Build.findOne = findOne;
        done();
      });
      Build.addJob({ id: 1 });

      done();
    });
  });

});
