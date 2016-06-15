import fetch from './fetch';
import errorActions from '../actions/errorActions';

const API = '/v0';

export default {
  fetch(endpoint, params) {
    const url = `${API}/${endpoint}`;

    return fetch(url, params).then((data) => {
      return data;
    }).catch((err) => {
      errorActions.httpError(err.response.statusText);
    });
  },

  fetchBuilds() {
    return this.fetch('build');
  },

  fetchSites() {
    return this.fetch('site');
  },

  fetchUser() {
    return this.fetch('user').then((user) => {
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        passports: user.passports,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  },

  addSite(site) {
    // TODO: Send post request
  },

  deleteSite(siteId) {
    // TODO: Send delete request
  }
}
