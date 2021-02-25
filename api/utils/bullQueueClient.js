const Queue = require('bull');
const config = require('../../config');

class BullQueueClient {
  constructor(queueName, opts = {}) {
    this.queueName = queueName;
    this.queue = this.buildQueue(queueName, opts);
  }

  buildQueue(
    queueName,
    {
      createClient,
      redis,
      limiter,
      prefix,
      defaultJobOptions,
      settings,
    } = {}
  ) {
    const { uri, tls } = config.redis;
    const updateRedis = { tls, ...redis };
    const updatedSettings = { drainDelay: 20, ...settings };
    return new Queue(queueName, uri, {
      createClient,
      redis: updateRedis,
      limiter,
      prefix,
      defaultJobOptions,
      settings: updatedSettings,
    });
  }

  add(data, opts = {}) {
    return this.queue.add(data, opts);
  }
}

module.exports = BullQueueClient;
