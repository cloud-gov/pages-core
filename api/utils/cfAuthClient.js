const jwt = require('jsonwebtoken');
const HttpClient = require('./httpClient');

class CloudFoundryAuthClient {
  constructor({ username, password, tokenUrl } = {}) {
    this.username = username ?? process.env.CF_API_USERNAME;
    this.password = password ?? process.env.CF_API_PASSWORD;
    this.httpClient = new HttpClient(tokenUrl ?? process.env.CLOUD_FOUNDRY_OAUTH_TOKEN_URL);
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
      .then(response => response.data.access_token)
      .catch(err => console.error(err));
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
