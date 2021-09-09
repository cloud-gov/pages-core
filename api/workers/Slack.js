const HttpClient = require('../utils/httpClient');

const { slack } = require('../../config');

class Slack {
  constructor({ url } = slack) {
    this.httpClient = new HttpClient();
    this.url = url;
  }

  send({ channel, text, username }) {
    return this.httpClient.request({
      method: 'POST',
      url: this.url,
      data: { channel, text, username },
    });
  }
}

module.exports = Slack;
