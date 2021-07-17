const { expect } = require('chai');
const BullQueueClient = require('../../../../api/utils/bullQueueClient');

describe('bullQueueClient', () => {
  it('should connect to a queue and add a job', () => {
    const queueName = 'test-add-data';
    const jobData = { job: 'test' };
    const defaultPrefix = 'bull';
    const defaultDrainDelay = 20;
    const queueClient = new BullQueueClient(queueName);

    return queueClient.add(jobData)
      .then((response) => {
        const { attemptsMade, data, queue } = response;
        expect(data).to.deep.equal(jobData);
        expect(attemptsMade).to.equal(0);
        expect(queue.name).to.equal(queueName);
        expect(queue.keyPrefix).to.equal(defaultPrefix);
        expect(queue.settings.drainDelay).to.equal(defaultDrainDelay);
      })
      .then(() => queueClient.queue.empty())
      .then(() => queueClient.queue.close());
  });

  it('should connect to a queue with custom job prefix, drain delay, and add a job', () => {
    const queueName = 'test-custom-add-data';
    const jobData = { job: 'test' };
    const customPrefix = 'test';
    const customDrainDelay = 100;
    const queueClient = new BullQueueClient(queueName, {
      prefix: customPrefix,
      settings: {
        drainDelay: customDrainDelay,
      },
    });

    return queueClient.add(jobData)
      .then((response) => {
        const { attemptsMade, data, queue } = response;
        expect(data).to.deep.equal(jobData);
        expect(attemptsMade).to.equal(0);
        expect(queue.name).to.equal(queueName);
        expect(queue.keyPrefix).to.equal(customPrefix);
        expect(queue.settings.drainDelay).to.equal(customDrainDelay);
      })
      .then(() => queueClient.queue.empty())
      .then(() => queueClient.queue.close());
  });

  it('should reject when adding bad data job', () => {
    const queueName = 'test-reject-add-data';
    const jobData = 'jobs-must-be-objects';
    const queueClient = new BullQueueClient(queueName);

    return queueClient.add(jobData)
      .catch((error) => {
        expect(error).to.deep.an.error;
      })
      .then(() => queueClient.queue.empty())
      .then(() => queueClient.queue.close());
  });
});
