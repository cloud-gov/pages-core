const expect = require('chai').expect;
const { UserAction } = require('../../../../api/models');

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

      model.validate().then(() => {
        expect(model).to.exist;
        done();
      }).catch(done);
    });
  });

  describe('validations', () => {
    it('requires userId, targetId, targetType, actionId, siteId', (done) => {
      const requiredFields = ['userId', 'targetId', 'targetType', 'actionId', 'siteId'];

      UserAction.create().then(() => {
        done();
      }).catch((error) => {
        const { errors } = error;
        const errorList = errors.reduce((memo, e) => [...memo, e.path], []);

        errorList.forEach((field) => {
          expect(requiredFields.indexOf(field)).to.not.equal(-1);
        });

        done();
      }).catch(done);
    });

    it('fails validation if targetType is not `site` or `build`', (done) => {
      const goodProps = {
        userId: 1,
        actionId: 1,
        targetId: 1,
        siteId: 1,
      };

      const promises = [
        UserAction.build(Object.assign({}, goodProps, { actionType: 'penguin' })).validate(),
        UserAction.build(Object.assign({}, goodProps, { actionType: 'alpaca' })).validate(),
      ];

      Promise.all(promises)
        .then((errors) => {
          expect(errors.length).to.equal(2);
          errors.forEach(e => expect(e.errors[0].path).to.equal('targetType'));
          done();
        }).catch(done);
    });
  });

  describe('.toJSON', () => {
    it('returns an object with a formatted createdAt date', () => {
      const model = UserAction.build(props);
      expect(model.toJSON().createdAt).to.equal(props.createdAt.toISOString());
    });
  });
});
