const expect = require('chai').expect;
const validateJSONSchema = require('jsonschema').validate;
const userActionSchema = require('../../../../public/swagger/UserAction.json');
const userActionFactory = require('../../support/factory/user-action');
const userActionSerializer = require('../../../../api/serializers/user-action');
const { UserAction } = require('../../../../api/models');

describe('user action serializer', () => {
  it('should serialize correctly', (done) => {
    userActionFactory
      .buildMany(3)
      .then((actions) => userActionSerializer.serialize(actions))
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

describe('.toJSON', () => {
  it('returns an object with a formatted createdAt date', () => {
    const props = {
      userId: 1,
      actionId: 1,
      targetId: 1,
      siteId: 1,
      targetType: 'site',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const model = UserAction.build(props);
    expect(userActionSerializer.toJSON(model).createdAt).to.equal(
      props.createdAt.toISOString(),
    );
  });
});
