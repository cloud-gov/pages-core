const NewRelicClient = require('../lib/newRelicClient');

/**
 * @param {NewRelicClient.Metric[]} metrics
 * @param {object} [options]
 * @param {NewRelicClient} [options.nrClient] - a New Relic Client instance
 */
async function send(metrics, { nrClient } = {}) {
  const nr = nrClient ?? new NewRelicClient();
  return nr.sendMetrics(metrics);
}

module.exports = send;
