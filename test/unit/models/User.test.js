var assert = require('assert');

describe('User Model', function() {

  describe('record.toJSON', function() {
    it('should not include passports', function(done) {
      User.create({}, function(err, user) {
        if (err) throw err;
        assert.equal(user.toJSON().passports, undefined);
        done();
      });
    });
  });

});
