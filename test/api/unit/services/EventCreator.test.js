const expect = require('chai').expect;
const sinon = require('sinon');
const factory = require('../../support/factory');
const { audit, error } = require('../../../../api/services/EventCreator');
const { logger } = require('../../../../winston');

describe('EventCreateor', () => {
  let loggerSpy;
  beforeEach(() => {
    loggerSpy = sinon.spy(logger, 'warn');
  })
  afterEach(() => {
    sinon.restore();
  })
  it('.audit event created', (done) => {
    factory.user()
      .then(user => audit('authentication', user, { hi: 'bye' })
        .then((event) => {
          expect(event.type).to.equal('audit');
          expect(event.label).to.equal('authentication');
          expect(event.model).to.equal('User');
          expect(event.modelId).to.equal(user.id);
          expect(event.body.hi).to.equal('bye');
          done();
        }));  
  });

  it('.audit event fail', (done) => {
    factory.user()
      .then(user => audit('invalidLabel', user, { hi: 'bye' }))
        .then(() => {
          expect(loggerSpy.called).to.be.true;
          done();
        });
  });

  it('.error event created', (done) => {
    error('timing', { bye: 'hi' })
      .then((event) => {
        expect(event.type).to.equal('error');
        expect(event.label).to.equal('timing');
        expect(event.model).to.be.null;
        expect(event.modelId).to.be.null;
        expect(event.body.bye).to.equal('hi');
        done();
      });
  });

  it('.error event fail', (done) => {
    factory.user()
      .then(user => error('invalidLabel', { hi: 'bye' }))
        .then(() => {
          expect(loggerSpy.called).to.be.true;
          done();
        });
  });
});
