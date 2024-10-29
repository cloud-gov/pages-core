const { expect } = require('chai');
const validateJSONSchema = require('jsonschema').validate;

const buildSchema = require('../../../../public/swagger/Build.json');
const factory = require('../../support/factory');

const BuildSerializer = require('../../../../api/serializers/build');

const arraySchema = {
  type: 'array',
  items: buildSchema,
};

describe('BuildSerializer', () => {
  describe('.serialize(serializable)', () => {
    it('should serialize an object correctly', async () => {
      const build = await factory.build();
      const object = await BuildSerializer.serialize(build);

      const result = validateJSONSchema(object, buildSchema);
      expect(result.errors).to.be.empty;
    });

    it('should serialize an array correctly', async () => {
      const builds = await Promise.all(
        Array(3)
          .fill(0)
          .map(() => factory.build()),
      );
      const object = await BuildSerializer.serialize(builds);

      const result = validateJSONSchema(object, arraySchema);
      expect(result.errors).to.be.empty;
    });

    it('should truncate the error message', async () => {
      const longString = Array(10).fill('abcdefghij').toString();
      expect(longString.length).to.be.greaterThan(80);

      const build = await factory.build({
        state: 'error',
        error: longString,
      });
      const object = await BuildSerializer.serialize(build);

      const result = validateJSONSchema(object, buildSchema);
      expect(result.errors).to.be.empty;
      expect(object.error.length).to.equal(80);
    });
  });
});
