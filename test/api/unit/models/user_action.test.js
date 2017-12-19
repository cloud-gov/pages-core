const expect = require('chai').expect;
const { UserAction } = require('../../../../api/models');

describe('UserAction model', () => {
  describe('instantiation', () => {
    it('creates a new UserAction record', (done) => {
      const model = UserAction.build({
        userId: 1,
        actionId: 1,
        targetId: 1,
        targetType: 'site',
      });

      model.validate().then(() => {
        expect(model).to.exist;
        done();
      }).catch(done);
    });
  });

  describe('validations', () => {
    it('requires userId, targetId, targetType, actionId, and createdAt', (done) => {
      const requiredFields = ['userId', 'targetId', 'targetType', 'actionId'];

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
});
