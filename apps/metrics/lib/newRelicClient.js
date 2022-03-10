const axios = require('axios');

/**
 * @typedef {Object} Metric
 * - (https://docs.newrelic.com/docs/data-apis/understand-data/new-relic-data-types#metrics)
 * @property {string} name - a metric name (ex. pages.memory.org)
 * @property {string} type - a New Relic metric type
 * - (https://docs.newrelic.com/docs/data-apis/understand-data/metric-data/metric-data-type/)
 * @property {number} value - the metric value
 * @property {number} timestamp - the time in milliseconds
 */

class NewRelicClient {
  /**
   * @param {object} [options]
   * @param {string} [options.newRelicUrl="https://gov-metric-api.newrelic.com"] - The New Relic Metrics Url
   * @param {string} [options.licenseKey] - A New Relic Ingest License Key
   */
  constructor({ newRelicUrl, licenseKey } = {}) {
    /**
     * @type {axios.AxiosInstance}
     */
    this.client = axios.create({
      baseURL: newRelicUrl ?? 'https://gov-metric-api.newrelic.com',
      headers: {
        'Api-Key': licenseKey ?? process.env.NEW_RELIC_LICENSE_KEY,
      },
    });
  }

  /**
   * @param {Metric[]} metrics
   */
  sendMetrics(metrics) {
    return this.client.post('/metric/v1', [{ metrics }]);
  }
}

module.exports = NewRelicClient;
