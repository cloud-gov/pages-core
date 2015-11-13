var assert = require('assert'),
    sinon = require('sinon');

describe('Build Model', function() {

  describe('.afterCreate', function() {
    it('should add job to queue', function(done) {
      var addJob = Build.addJob;
      Build.addJob = sinon.spy(function() {
        assert(Build.addJob.called);
        Build.addJob = addJob;
        done();
      });
      Build.afterCreate({});
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
      var findOne = Build.findOne;
      Build.findOne = sinon.spy(function() {
        assert(Build.findOne.called);
        Build.findOne = findOne;
        done();
      });
      Build.addJob({ id: 1 });
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
