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
    it('should validate password', function(done) {
      User.findOrCreate({ id: 1 }, {}, function(err) {
        if (err) throw err;
        Passport.create({
          protocol: 'test',
          password: 'password',
          user: 1
        }, function(err, passport) {
          if (err) throw err;
          passport.validatePassword('password', function(err, valid) {
            assert.equal(err, null);
            assert(valid);
            done();
          });
        });
      });
    });
  });

});
