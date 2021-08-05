/* eslint-disable no-console */
const timeoutBuilds = require('../api/workers/jobProcessors/timeoutBuilds');

timeoutBuilds()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
