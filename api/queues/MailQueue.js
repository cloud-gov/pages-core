const { Queue } = require('bullmq');

const MailQueueName = 'mail';

// class MailQueue extends Queue {
//   constructor(connection) {
//     super(MailQueueName, { connection });
//   }
// }

// module.exports = {
//   MailQueue,
//   MailQueueName,
// };

let queue;

function init(connection) {
  queue = new Queue(MailQueueName, { connection });
  return queue;
}

function add(name, data) {
  if (!queue) {
    throw new Error('');
  }

  return queue.add(name, data);
}

module.exports = {
  add, init, MailQueueName,
};
