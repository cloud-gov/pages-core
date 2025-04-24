const { Queue } = require('bullmq');

const CreateEditorSiteQueueName = 'create-editor-site';

class CreateEditorSiteQueue extends Queue {
  constructor(connection, { attempts = 1 } = {}) {
    super(CreateEditorSiteQueueName, {
      connection,
      defaultJobOptions: {
        attempts,
      },
    });
  }
}

module.exports = {
  CreateEditorSiteQueue,
  CreateEditorSiteQueueName,
};
