var assert = require('assert');

describe('Passport Model', function() {

  describe('.beforeCreate', function() {
    it('should hash password', function(done) {
      Passport.beforeCreate({ password: 'password' }, function (err, passport) {
        assert.notEqual(passport.password, 'password');
        done();
      });
    });
  });

  describe('.beforeUpdate', function() {
    it('should hash password', function(done) {
      Passport.beforeUpdate({ password: 'password' }, function (err, passport) {
        assert.notEqual(passport.password, 'password');
        done();
      });
    });
  });

  describe('record.validatePassword', function() {

  });

});
