function createJobLogger(job) {
  let logs = [];
  return {
    log(msg) {
      logs.push(job.log(msg));
    },
    async flush() {
      await Promise.all(logs);
      logs = [];
    },
  };
}

module.exports = {
  createJobLogger,
};
