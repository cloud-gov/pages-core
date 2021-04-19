const request = require('request');
const url = require('url');
const config = require('../../config');

const uaaOptions = config.passport.uaa;

class UAAClient {
  constructor(accessToken, role) {
    this.accessToken = accessToken;
    this.clientId = role === 'admin' ? uaaOptions.adminOptions.clientID : uaaOptions.options.clientID;
  }

  async verifyUserGroup(userId, groupNames = []) {
    const { groups, origin, verified } = await this.request('GET', `/Users/${userId}`);
    if (origin === 'cloud.gov' && !verified) {
      return false;
    }

    return groups.filter(group => groupNames.includes(group.display)).length > 0;
  }

  async inviteUser(email) {
    const params = new URLSearchParams();
    params.set('redirect_uri', config.hostname);
    params.set('client_id', this.clientId);

    const { new_invites: [invite] } = await this.request('POST', `/invite_users?${params.toString()}`, { emails: [email] });

    return invite;
  }

  request(method, path, json) {
    return new Promise((resolve, reject) => {
      const callback = (error, response, body) => {
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
      };

      const options = {
        method: method.toUpperCase(),
        url: url.resolve(config.env.uaaHostUrl, path),
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      };

      if (json) {
        options.json = true;
        options.body = json;
      }

      request(options, callback);
    });
  }
}

module.exports = UAAClient;
