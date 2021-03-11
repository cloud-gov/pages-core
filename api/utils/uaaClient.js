const request = require('request');
const url = require('url');
const config = require('../../config');

class UAAClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
  }

  async verifyUserGroup(userId, groupNames = []) {
    const { groups, origin, verified } = await this.request('GET', `/Users/${userId}`);
    if (origin === 'cloud.gov' && !verified) {
      return false;
    }

    return groups.filter(group => groupNames.includes(group.display)).length > 0;
  }

  request(method, path, json) {
    const host = config.env.uaaHost === 'http://localhost:9000'
      ? 'http://uaa:8080' : config.env.uaaHost;

    return new Promise((resolve, reject) => {
      request({
        method: method.toUpperCase(),
        url: url.resolve(host, path),
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        json,
      }, (error, response, body) => {
        const result = body ? JSON.parse(body) : {};
        const { error: bodyError } = result;

        if (error || bodyError) {
          reject(error || bodyError);
        } else if (response.statusCode > 399) {
          const errorMessage = `Received status code: ${response.statusCode}`;
          reject(new Error(JSON.stringify(body) || errorMessage));
        } else {
          resolve(result);
        }
      });
    });
  }
}

module.exports = UAAClient;
