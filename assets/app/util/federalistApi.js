import fetch from './fetch';
import errorActions from '../actions/errorActions';

const API = '/v0';

export default {
  fetch(endpoint, params) {
    const url = `${API}/${endpoint}`;

    return fetch(url, params).then((data) => {
      return data;
    }).catch((error) => {
      errorActions.httpError(error.message);
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
    return this.fetch(`user/add-site`, {
      method: 'POST',
      data: site
    });
  },

  cloneRepo(destination, source) {
    return this.fetch('site/clone', {
      method: 'POST',
      data: {
        sourceOwner: source.owner,
        sourceRepo: source.repo,
        destinationOrg: destination.organization,
        destinationRepo: destination.repo,
        destinationBranch: destination.branch || 'master',
        engine: destination.engine || 'jekyll'
      }
    });
  },

  updateSite(site, data) {
    return this.fetch(`site/${site.id}`, {
      method: 'PUT',
      data: data
    });
  },

  deleteSite(siteId) {
    return this.fetch(`site/${siteId}`, {
      method: 'DELETE'
    });
  }
}
