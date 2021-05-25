const axios = require('axios');

class HttpClient {
  /**
   * @param {string} baseURL
   */
  constructor(baseURL) {
    /**
     * @type {axios.AxiosInstance}
     */
    this.client = axios.create({
      baseURL,
      responseType: 'json', // default
      validateStatus(status) {
        return status >= 200 && status < 400;
      },
    });

    this.client.interceptors.response.use(
      response => response,
      async (error) => {
        const { response } = error;

        if (response) {
          if (response.data && response.data.error) {
            const msg = `${response.data.error}
            ${response.data.error_description || ''}
            ${response.data.scope || ''}`.trim();
            throw new Error(msg);
          }

          if (response.status < 500) {
            const errorMessage = `Received status code: ${response.status}`;
            throw new Error(JSON.stringify(response.data) || errorMessage);
          }
        }

        throw error;
      }
    );
  }

  /**
   * @param {axios.AxiosRequestConfig} config
   */
  request(config) {
    return this.client.request(config);
  }
}

module.exports = HttpClient;
