const expect = require('chai').expect;
const validateJSONSchema = require('jsonschema').validate;
const userActionSchema = require('../../../../public/swagger/UserAction.json');
const userActionFactory = require('../../support/factory/user-action');
const userActionSerializer = require('../../../../api/serializers/user-action');

describe('user action serializer', () => {
  it('should serialize correctly', (done) => {
    userActionFactory.buildMany(3)
    .then(actions => userActionSerializer.serialize(actions))
    .then((object) => {
      const arraySchema = {
        type: 'array',
        items: userActionSchema,
      };
      const result = validateJSONSchema(object, arraySchema);

      expect(result.errors).to.be.empty;
      done();
    })
    .catch(done);
  });
});
