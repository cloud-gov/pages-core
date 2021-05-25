const jwt = require('jsonwebtoken');
const config = require('../../config');
const HttpClient = require('./httpClient');

class CloudFoundryAuthClient {
  constructor() {
    this.username = config.deployUser.username;
    this.password = config.deployUser.password;
    this.token = '';
    this.httpClient = new HttpClient(config.env.cfOauthTokenUrl);
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
    return this.httpClient.request({
      method: 'post',
      auth: {
        username: 'cf',
        password: '',
      },
      data: new URLSearchParams({
        grant_type: 'password',
        username: this.username,
        password: this.password,
        response_type: 'token',
      }).toString(),
    })
      .then(response => response.data.access_token);
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
