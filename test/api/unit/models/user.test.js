const { expect } = require('chai');
const { User } = require('../../../../api/models');

describe.only('User model', () => {
  it('lowercases usernames on save', () => {
    const mixedCaseName = 'SoManyCases';
    User.create({
      username: mixedCaseName,
    })
    .then((user) => {
      expect(user.username).to.equal(mixedCaseName.toLowerCase());
    });
  });

  describe('validations', () => {
    it('should validate that an email is formatted properly if present', done => {
      User.create({
        username: 'bad-email-user',
        email: 'thisisnotanemail',
      })
      .then(() =>
        done(new Error('Excepted validation error'))
      )
      .catch(err => {
        expect(err.name).to.equal('SequelizeValidationError');
        expect(err.errors[0].path).to.equal('email');
        done();
      })
      .catch(done);
    });

    it('should require a username to be present', done => {
      User.create({
        username: null,
        email: 'email-me@example.com',
      })
      .then(() =>
        done(new Error('Excepted validation error'))
      )
      .catch(err => {
        expect(err.name).to.equal('SequelizeValidationError');
        expect(err.errors[0].path).to.equal('username');
        done();
      })
      .catch(done);
    });
  });
});
