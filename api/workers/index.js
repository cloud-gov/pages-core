const queueConfig = require('./queueConfig');
const { initialize } = require('./QueueHelper.js');

const queueNames = Object.keys(queueConfig);
queueNames.forEach((queueName) => {
  initialize(queueName, queueConfig[queueName]);
});
