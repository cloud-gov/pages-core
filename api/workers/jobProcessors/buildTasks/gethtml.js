const axios = require('axios');

async function gethtml(task, logger, s3Client, callbackUrl) {
  logger.log('gethtml task');
  const key = `_tasks/artifacts/${task.id}`;
  const site = await axios.get(task.Build.url);
  await s3Client.putObject(JSON.stringify(site.data), key);

  await axios.put(callbackUrl, {
    artifact: key,
    status: 'success',
  });

  return true;
}

module.exports = gethtml;
