const cfenv = require('cfenv');
const jwt = require('jsonwebtoken');
const request = require('request');

class CloudFoundryAuthClient {
  constructor() {
    this.username = this.cloudFoundryCredentials().DEPLOY_USER_USERNAME;
    this.password = this.cloudFoundryCredentials().DEPLOY_USER_PASSWORD;
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

  // Private methods
  cloudFoundryCredentials() {
    const appEnv = cfenv.getAppEnv();
    const cloudFoundryCredentials = appEnv.getServiceCreds('federalist-deploy-user');

    if (cloudFoundryCredentials) {
      return cloudFoundryCredentials;
    }
    return {
      DEPLOY_USER_USERNAME: process.env.DEPLOY_USER_USERNAME,
      DEPLOY_USER_PASSWORD: process.env.DEPLOY_USER_PASSWORD,
    };
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
    return process.env.CLOUD_FOUNDRY_OAUTH_TOKEN_URL;
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
