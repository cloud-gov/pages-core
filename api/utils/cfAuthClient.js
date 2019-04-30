const jwt = require('jsonwebtoken');
const request = require('request');
const config = require('../../config');

class CloudFoundryAuthClient {
  constructor() {
    this.username = config.deployUser.username;
    this.password = config.deployUser.password;
    this.token = '';
  }

  accessToken() {
    return new Promise((resolve) => {
      if (this.tokenExpired()) {
        resolve(this.fetchNewToken());
      } else {
        resolve(this.token);
      }
    });
  }

  fetchNewToken() {
    return this.sendNewTokenRequest().then((token) => {
      this.token = token;
      return token;
    });
  }

  sendNewTokenRequest() {
    return new Promise((resolve, reject) => {
      request.post({
        url: this.tokenEndpoint(),
        auth: {
          username: 'cf',
          password: '',
        },
        form: {
          grant_type: 'password',
          username: this.username,
          password: this.password,
          response_type: 'token',
        },
      }, (error, response, body) => {
        if (error) {
          reject(error);
        } else if (response.statusCode > 399) {
          const errorMessage = `Received status code: ${response.statusCode}`;
          reject(new Error(body || errorMessage));
        } else {
          resolve(JSON.parse(body).access_token);
        }
      });
    });
  }

  tokenEndpoint() {
    return config.env.cfOauthTokenUrl;
  }

  tokenExpired() {
    if (this.token) {
      const decodedToken = jwt.decode(this.token);
      return decodedToken.exp - (Date.now() / 1000) < 5;
    }
    return true;
  }
}

module.exports = CloudFoundryAuthClient;
