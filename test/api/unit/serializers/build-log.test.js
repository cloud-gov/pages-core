const { expect } = require('chai');
const { validate: validateJSONSchema } = require('jsonschema');

const buildLogSchema = require('../../../../public/swagger/BuildLog.json');
const factory = require('../../support/factory');

const BuildLogSerializer = require('../../../../api/serializers/build-log');

const arraySchema = {
  type: 'array',
  items: buildLogSchema,
};

describe('BuildLogSerializer', () => {
  describe('.serialize(serializable)', () => {
    it('should serialize an object correctly', async () => {
      const buildLog = await factory.buildLog();
      
      const object = BuildLogSerializer.serialize(buildLog);
      
      const result = validateJSONSchema(object, buildLogSchema);
      expect(result.errors).to.be.empty;
    });

    describe('.serialize(serializable)', () => {
      it('should serialize an array of objects correctly', async () => {
        const buildLogs = await Promise.all(Array(3).fill(0).map(() => factory.buildLog()));

        const object = BuildLogSerializer.serializeMany(buildLogs);
            
        const result = validateJSONSchema(object, arraySchema);
        expect(result.errors).to.be.empty;
      });
    });
  });
});
