import http from 'axios';

import errorActions from '../actions/errorActions';

const API = '/v0';

export default {
  fetch(url, ...params) {
    let u = `${API}/${url}`;
    return http.get(u).then((res) => {
      if (res.status === 200) return res.data;

      Promise.reject(res.statusText);
    }).catch((err) => {
      errorActions.httpError(err);
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
