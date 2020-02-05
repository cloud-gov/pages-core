const { expect } = require('chai');
const validateJSONSchema = require('jsonschema').validate;

const userSchema = require('../../../../public/swagger/User.json');
const factory = require('../../support/factory');

const UserSerializer = require('../../../../api/serializers/user');

describe('UserSerializer', () => {
  describe('.serialize(serializable)', () => {
    it('should serialize an object correctly', (done) => {
      factory.user()
      .then(user => UserSerializer.serialize(user))
      .then((object) => {
        const result = validateJSONSchema(object, userSchema);

        expect(result.errors).to.be.empty;
        done();
      }).catch(done);
    });

    it('should serialize an array correctly', (done) => {
      const userPromises = Array(3).fill(0).map(() => factory.user());

      Promise.all(userPromises)
      .then(users => UserSerializer.serialize(users))
      .then((object) => {
        const arraySchema = {
          type: 'array',
          items: userSchema,
        };
        const result = validateJSONSchema(object, arraySchema);
        expect(result.errors).to.be.empty;
        done();
      }).catch(done);
    });
  });
});
