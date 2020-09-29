const { expect } = require('chai');
const factory = require('../../support/factory');

describe('Event model', () => {
  it('should validate the type', (done) => {
    factory.event({
      type: 'audit',
      label: 'timing',
    })
    .then((event) => {
      expect(event.type).to.equal('audit');
      expect(event.label).to.equal('timing');
      done();
    });
  });

  it('should validate the type', (done) => {
    factory.event({
      type: 'invalid',
      label: 'timing',
    })
    .catch((err) => {
      expect(err.message).to.equal('Validation error: Invalid event type: invalid');
      done();
    });
  });

  it('should validate the label', (done) => {
    factory.event({
      type: 'audit',
      label: 'invalid',
    })
    .catch((err) => {
      expect(err.message).to.equal('Validation error: Invalid event label: invalid');
      done();
    });
  });
});
