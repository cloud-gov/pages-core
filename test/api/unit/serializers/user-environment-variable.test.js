const { expect } = require('chai');
const { validate: validateJSONSchema } = require('jsonschema');

const schema = require('../../../../public/swagger/UserEnvironmentVariable.json');
const factory = require('../../support/factory/user-environment-variable');

const { serialize, serializeMany } = require('../../../../api/serializers/user-environment-variable');

const arraySchema = {
  type: 'array',
  items: schema,
};

describe('UserEnvironmentSerializer', () => {
  describe('.serialize', () => {
    it('should serialize an object correctly', () => {
      const obj = factory.build({ id: 1 });

      const json = serialize(obj);

      const result = validateJSONSchema(json, schema);
      expect(result.errors).to.be.empty;
    });

    describe('.serializeMany', () => {
      it('should serialize an array of objects correctly', () => {
        const objs = [factory.build({ id: 1 }), factory.build({ id: 2 })];

        const json = serializeMany(objs);

        const result = validateJSONSchema(json, arraySchema);
        expect(result.errors).to.be.empty;
      });
    });
  });
});
