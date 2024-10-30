const { expect } = require('chai');
const validateJSONSchema = require('jsonschema').validate;

const userSchema = require('../../../../public/swagger/User.json');
const factory = require('../../support/factory');
const uaaIdentityFactory = require('../../support/factory/uaa-identity');

const UserSerializer = require('../../../../api/serializers/user');

const arraySchema = {
  type: 'array',
  items: userSchema,
};

describe('UserSerializer', () => {
  describe('.toJSON(serializable)', () => {
    it('should serialize a user object correctly', async () => {
      const uaaEmail = 'bar@foo.com';
      const user = await factory.user({
        adminEmail: 'foo@bar.com',
      });
      await user.createUAAIdentity(uaaIdentityFactory.uaaUser({ email: uaaEmail }));
      await user.reload({
        include: ['UAAIdentity'],
      });

      const userJson = UserSerializer.toJSON(user);
      const result = validateJSONSchema(userJson, userSchema);

      expect(result.errors).to.be.empty;
      expect(userJson.adminEmail).to.be.undefined;
      expect(userJson.UAAIdentity.email).to.eq(uaaEmail);
    });

    it('includes admin attributes', async () => {
      const adminEmail = 'foo@bar.com';
      const user = await factory.user({
        adminEmail,
      });
      const userJson = UserSerializer.toJSON(user, true);
      const result = validateJSONSchema(userJson, userSchema);

      expect(result.errors).to.be.empty;
      expect(userJson.adminEmail).to.eq(adminEmail);
    });

    it('includes UAA attributes if present for admins', async () => {
      const uaaEmail = 'foo@bar.com';
      const user = await factory.user();
      await user.createUAAIdentity(uaaIdentityFactory.uaaUser({ email: uaaEmail }));
      await user.reload({
        include: ['UAAIdentity'],
      });

      const userJson = UserSerializer.toJSON(user, true);
      const result = validateJSONSchema(userJson, userSchema);

      expect(result.errors).to.be.empty;
      expect(userJson.UAAIdentity.email).to.eq(uaaEmail);
    });
  });

  describe('.serializeMany(serializables)', () => {
    it('should serialize an array of user objects correctly', async () => {
      const users = await Promise.all([factory.user(), factory.user(), factory.user()]);

      const usersJson = UserSerializer.serializeMany(users);
      const result = validateJSONSchema(usersJson, arraySchema);

      expect(result.errors).to.be.empty;
    });
  });
});
