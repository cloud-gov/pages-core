/* eslint-disable no-underscore-dangle */
const { expect } = require('chai');
const IORedis = require('ioredis');

const { redis: redisConfig } = require('../../../config');

const QueueWorker = require('../../../api/workers/QueueWorker');

describe('QueueWorker', () => {
  describe('new QueueWorker()', () => {
    const queueName = 'queue';
    const processor = () => { };

    let queueWorker;

    before(() => {
      const connection = new IORedis(redisConfig.url, {
        tls: redisConfig.tls,
        maxRetriesPerRequest: null
      });
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
