const { expect } = require('chai');
const validateJSONSchema = require('jsonschema').validate;

const userSchema = require('../../../../public/swagger/User.json');
const factory = require('../../support/factory');

const UserSerializer = require('../../../../api/serializers/user');

describe('UserSerializer', () => {
  describe('.toJSON(serializable)', () => {
    it('should serialize a user object correctly', async () => {
      const user = await factory.user();
      const userJson = UserSerializer.toJSON(user); 
      const result = validateJSONSchema(userJson, userSchema);

      expect(result.errors).to.be.empty;
    });
  });
});
