const expect = require('chai').expect;
const sinon = require('sinon');
const factory = require('../../support/factory');
const { audit, error, warn } = require('../../../../api/services/EventCreator');
const { logger } = require('../../../../winston');

describe('EventCreateor', () => {
  let warnSpy;
  let infoSpy;
  let errorSpy;
  beforeEach(() => {
    warnSpy = sinon.spy(logger, 'warn');
    infoSpy = sinon.spy(logger, 'info');
    errorSpy = sinon.spy(logger, 'error');
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('.audit', () => {
    it('.audit event created', (done) => {
      factory.user()
        .then(user => audit('authentication', user, { hi: 'bye' })
          .then((event) => {
            expect(event.type).to.equal('audit');
            expect(event.label).to.equal('authentication');
            expect(event.model).to.equal('User');
            expect(event.modelId).to.equal(user.id);
            expect(event.body.hi).to.equal('bye');
            expect(infoSpy.called).to.be.true;
            expect(warnSpy.called).to.be.false;
            done();
        }));
    });

    it('.audit event fail', (done) => {
      factory.user()
        .then(user => audit('invalidLabel', user, { hi: 'bye' }))
          .then(() => {
            expect(warnSpy.called).to.be.true;
            expect(infoSpy.called).to.be.false;
            done();
          });
    });
  });

  describe('.error', () => {
    it('.error event created', (done) => {
      error('timing', { bye: 'hi' })
        .then((event) => {
          expect(event.type).to.equal('error');
          expect(event.label).to.equal('timing');
          expect(event.model).to.be.null;
          expect(event.modelId).to.be.null;
          expect(event.body.bye).to.equal('hi');
          expect(errorSpy.called).to.be.true;
          expect(warnSpy.called).to.be.false;
          expect(infoSpy.called).to.be.false;
          done();
        });
    });

    it('.error event fail', (done) => {
      error('invalidLabel', { hi: 'bye' })
          .then(() => {
            expect(warnSpy.called).to.be.true;
            expect(errorSpy.called).to.be.false;
            expect(infoSpy.called).to.be.false;
            done();
          });
    });
  });
  describe('.warn', () => {
    it('.warn event created', (done) => {
      warn('build-status', { hi: 'bye' })
        .then((event) => {
          expect(event.type).to.equal('warning');
          expect(event.label).to.equal('build-status');
          expect(event.model).to.be.null;
          expect(event.modelId).to.be.null;
          expect(event.body.hi).to.equal('bye');
          done();
        });
    });

    it('.warn event fail', (done) => {
      warn('invalidLabel', { hi: 'bye' })
          .then(() => {
            expect(warnSpy.called).to.be.true;
            expect(errorSpy.called).to.be.false;
            expect(infoSpy.called).to.be.false;
            done();
          });
    });
  });
});
