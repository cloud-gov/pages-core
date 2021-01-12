const expect = require('chai').expect;
const sinon = require('sinon');
const factory = require('../../support/factory');
const { audit, error, warn } = require('../../../../api/services/EventCreator');
const { logger } = require('../../../../winston');

describe('EventCreator', () => {
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
    it('.audit event created', async () => {
      const user = await factory.user();
      const event = await  audit('authentication', user, 'audit message', { hi: 'bye' });
      expect(event.type).to.equal('audit');
      expect(event.label).to.equal('authentication');
      expect(event.model).to.equal('User');
      expect(event.modelId).to.equal(user.id);
      expect(event.body.hi).to.equal('bye');
      expect(event.body.message).to.equal('audit message');
      expect(infoSpy.called).to.be.true;
      expect(warnSpy.called).to.be.false;
    });

    it('.audit event fail', async () => {
      const user = await factory.user();
      await audit('invalidLabel', user, 'the message', { hi: 'bye' });
      expect(warnSpy.called).to.be.true;
      expect(infoSpy.called).to.be.false;
    });
  });

  describe('.error', () => {
    const err = new Error('not working');
    it('.error event created', async () => {
      const event = await error('request-handler', err, { bye: 'hi' })
      expect(event.type).to.equal('error');
      expect(event.label).to.equal('request-handler');
      expect(event.model).to.be.null;
      expect(event.modelId).to.be.null;
      expect(event.body.bye).to.equal('hi');
      expect(event.body.message).to.equal(err.message);
      expect(event.body.error).to.equal(err.stack);
      expect(errorSpy.called).to.be.true;
      expect(warnSpy.called).to.be.false;
      expect(infoSpy.called).to.be.false;
    });

    it('.error event created', async () => {
      const message = 'override error message';
      const event = await error('request-handler', err, { bye: 'hi', message });
      expect(event.type).to.equal('error');
      expect(event.label).to.equal('request-handler');
      expect(event.model).to.be.null;
      expect(event.modelId).to.be.null;
      expect(event.body.bye).to.equal('hi');
      expect(event.body.message).to.equal(message);
      expect(event.body.error).to.equal(err.stack);
      expect(errorSpy.called).to.be.true;
      expect(warnSpy.called).to.be.false;
      expect(infoSpy.called).to.be.false;
    });

    it('.error event fail', async () => {
      await error('invalidLabel', err, { hi: 'bye' });
      expect(warnSpy.called).to.be.true;
      expect(errorSpy.called).to.be.false;
      expect(infoSpy.called).to.be.false;
    });
  });
  describe('.warn', () => {
    const message = 'the message';
    it('.warn event created', async () => {
      const event = await warn('request-handler', message, { hi: 'bye' })
      expect(event.type).to.equal('warning');
      expect(event.label).to.equal('request-handler');
      expect(event.model).to.be.null;
      expect(event.modelId).to.be.null;
      expect(event.body.hi).to.equal('bye');
      expect(event.body.message).to.equal(message);
    });

    it('.warn event fail', async () => {
      await warn('invalidLabel', message, { hi: 'bye' });
      expect(warnSpy.called).to.be.true;
      expect(errorSpy.called).to.be.false;
      expect(infoSpy.called).to.be.false;
    });
  });
});
