const request = require('request');
const url = require('url');
const config = require('../../config');

class UAAClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
  }

  async verifyUserGroup(userId, groupName) {
    const { groups, origin, verified } = await this.request('GET', `/Users/${userId}`);
    if (origin === 'cloud.gov' && !verified) {
      return false;
    }

    return groups.filter(group => group.display === groupName).length === 1;
  }

  request(method, path, json) {
    return new Promise((resolve, reject) => {
      request({
        method: method.toUpperCase(),
        url: url.resolve(
          config.env.uaaHost,
          path
        ),
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
