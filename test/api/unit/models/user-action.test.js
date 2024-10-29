const { expect } = require('chai');
const { UserAction } = require('../../../../api/models');
const userActionSerializer = require('../../../../api/serializers/user-action');

const props = {
  userId: 1,
  actionId: 1,
  targetId: 1,
  siteId: 1,
  targetType: 'site',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UserAction model', () => {
  describe('instantiation', () => {
    it('creates a new UserAction record', (done) => {
      const model = UserAction.build(props);

      model
        .validate()
        .then(() => {
          expect(model).to.exist;
          done();
        })
        .catch(done);
    });
  });

  describe('validations', () => {
    it('requires userId, targetId, targetType, actionId, siteId', (done) => {
      const requiredFields = ['userId', 'targetId', 'targetType', 'actionId', 'siteId'];

      UserAction.create()
        .then(() => {
          done();
        })
        .catch((error) => {
          const { errors } = error;
          const errorList = errors.reduce((memo, e) => [...memo, e.path], []);

          errorList.forEach((field) => {
            expect(requiredFields.indexOf(field)).to.not.equal(-1);
          });

          done();
        })
        .catch(done);
    });

    it('fails validation if targetType is not `site` or `build`', (done) => {
      const goodProps = {
        userId: 1,
        actionId: 1,
        targetId: 1,
        siteId: 1,
        actionType: 'penguin',
        targetType: 'notSiteNorBuild',
      };

      UserAction.build(goodProps)
        .validate()
        .catch((e) => {
          expect(e.errors[0].path).to.equal('targetType');
          done();
        })
        .catch(done);
    });

    it('fails validation if targetType is not null', (done) => {
      const goodProps = {
        userId: 1,
        actionId: 1,
        targetId: 1,
        siteId: 1,
        actionType: 'penguin',
      };

      UserAction.build(goodProps)
        .validate()
        .catch((e) => {
          expect(e.errors[0].path).to.equal('targetType');
          done();
        })
        .catch(done);
    });
  });

  describe('.toJSON', () => {
    it('returns an object with a formatted createdAt date', () => {
      const model = UserAction.build(props);
      expect(userActionSerializer.toJSON(model).createdAt).to.equal(
        props.createdAt.toISOString(),
      );
    });
  });
});
