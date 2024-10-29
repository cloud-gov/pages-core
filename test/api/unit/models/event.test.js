const { expect } = require('chai');
const factory = require('../../support/factory');

describe('Event model', () => {
  it('should validate the type', (done) => {
    factory
      .event({
        type: 'audit',
        label: 'request-handler',
        model: 'User',
      })
      .then((event) => {
        expect(event.type).to.equal('audit');
        expect(event.label).to.equal('request-handler');
        done();
      });
  });

  it('should not allow invalid type', (done) => {
    factory
      .event({
        type: 'invalidType',
        label: 'request-handler',
        model: 'User',
      })
      .catch((err) => {
        expect(err.message).to.equal('Validation error: Invalid event type: invalidType');
        done();
      });
  });

  it('should not allow invalid label', (done) => {
    factory
      .event({
        type: 'audit',
        label: 'invalidLabel',
        model: 'User',
      })
      .catch((err) => {
        expect(err.message).to.equal(
          'Validation error: Invalid event label: invalidLabel',
        );
        done();
      });
  });

  it('should not allow invalid model', (done) => {
    factory
      .event({
        type: 'audit',
        label: 'request-handler',
        model: 'invalidModel',
      })
      .catch((err) => {
        expect(err.message).to.equal(
          'Validation error: Invalid event model: invalidModel',
        );
        done();
      });
  });
});
