const HttpClient = require('../utils/httpClient');

const { mailer } = require('../../config');

class Mailer {
  constructor({ host, password, username } = mailer) {
    this.httpClient = new HttpClient(host);
    this.password = password;
    this.username = username;
  }

  async send({ html, subject, to }) {
    const { data, status } = await this.httpClient.request({
      method: 'POST',
      url: '/send',
      auth: {
        password: this.password,
        username: this.username,
      },
      data: {
        to,
        subject,
        html,
      },
    });

    return { data, status };
  }
}

module.exports = Mailer;
