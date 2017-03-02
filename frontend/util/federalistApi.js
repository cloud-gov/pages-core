import fetch from './fetch';
import alertActions from '../actions/alertActions';

const API = '/v0';

export default {
  fetch(endpoint, params) {
    const url = `${API}/${endpoint}`;

    return fetch(url, params).then((data) => {
      return data;
    }).catch((error) => {
      alertActions.httpError(error.message);
    });
  },

  fetchBuilds() {
    return this.fetch('build');
  },

  fetchBuildLogs(build) {
    return this.fetch(`build/${build.id}/log`);
  },

  fetchSites() {
    return this.fetch('site');
  },

  fetchUser() {
    return this.fetch('me');
  },

  addSite(site) {
    return this.fetch(`site`, {
      method: 'POST',
      data: site
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
  },

  restartBuild(build) {
    return this.fetch(`build/`, {
      method: 'POST',
      data: {
        site: build.site.id || build.site,
        branch: build.branch,
      },
    });
  },
}
