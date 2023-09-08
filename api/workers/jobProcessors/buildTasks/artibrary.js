const axios = require('axios');

async function arbitrary(task, logger, s3Client, callbackUrl) {
  logger.log('artibrary task');
  const key = `_tasks/artifacts/${task.id}`;
  await s3Client.putObject(JSON.stringify(task), key);

  await axios.put(callbackUrl, {
    artifact: key,
    status: 'success',
  });

  return true;
}

module.exports = arbitrary;
