const { expect } = require('chai');
const BullQueueClient = require('../../../api/utils/bullQueueClient');
const { initialize } = require('../../../api/workers/QueueHelper');

describe('QueueHelper', () => {
  const disposeQueue = async (queue) => {
      await queue.queue.empty();
      await queue.queue.clean(1);
      await queue.queue.clean(1, 'failed');
      await queue.queue.close();
  }
  describe('initialize', () => {
    let queue;
    let queueName;
    let queueConfig;
    beforeEach(() => {
      queueName = `queue-${Date.now()}`;
      queueConfig = { [queueName]: {
        processJob: async () => Promise.resolve(),
      }};
    });
    afterEach(async () => {
      await disposeQueue(queue);
    });
    it('initialize worker queue', async () => {
        queue = new BullQueueClient(queueName);
        const preJobs = await queue.queue.getJobs();
        const initQueue = await initialize(queueName, queueConfig);
        expect(initQueue.queueName).to.equal(queue.queue.name);
        const postJobs = await queue.queue.getJobs();
        expect(postJobs.length).to.equal(preJobs.length + 1);
        disposeQueue(initQueue);
    });
  });
});