const { expect } = require('chai');
const { connection } = require('../support/queues');

const QueueWorker = require('../../../api/workers/QueueWorker');

describe('QueueWorker', () => {
  describe('new QueueWorker()', () => {
    const queueName = 'queue';
    const processor = () => { };

    let queueWorker;

    before(() => {
      queueWorker = new QueueWorker(queueName, connection, processor);
    });

    it('creates a Bull MQ Worker QueueWorker with the provided arguments and defaults', () => {
      expect(queueWorker.name).to.eq(queueName);
      expect(queueWorker.processFn).to.eq(processor);
      expect(queueWorker.opts.concurrency).to.eq(5);
    });

    it('attaches handlers to error, completed, and failed events', () => {
      expect(queueWorker._events.error).to.have.lengthOf(1);
      expect(queueWorker._events.completed).to.be.a('function');
      expect(queueWorker._events.failed).to.be.a('function');
    });
  });
});
