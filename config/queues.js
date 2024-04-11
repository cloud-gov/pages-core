const buildTasksConcurrency = process.env.QUEUES_BUILD_TASKS_CONCURRENCY
  ? parseInt(process.env.QUEUES_BUILD_TASKS_CONCURRENCY, 10)
  : 5;

module.exports = {
  buildTasksConcurrency,
};
