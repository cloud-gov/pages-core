/* global window:true */

import fetch from './fetch';
import alertActions from '../actions/alertActions';

export const API = '/v0';

export default {
  fetch(endpoint, params = {}, { handleHttpError = true } = {}) {
    const csrfToken = typeof window !== 'undefined' ?
      window.CSRF_TOKEN : global.CSRF_TOKEN;

    const defaultHeaders = {
      'x-csrf-token': csrfToken,
    };

    const url = `${API}/${endpoint}`;

    const headers = Object.assign({}, defaultHeaders, params.headers || {});
    const finalParams = Object.assign({}, params, { headers });

    return fetch(url, finalParams)
      .catch((error) => {
        if (handleHttpError) {
          alertActions.httpError(error.message);
        } else {
          throw error;
        }
      });
  },

  fetchBuilds(site) {
    return this.fetch(`site/${site.id}/build`);
  },

  fetchBuildLogs(build) {
    return this.fetch(`build/${build.id}/log`);
  },

  fetchPublishedBranches(site) {
    return this.fetch(`site/${site.id}/published-branch`);
  },

  fetchPublishedFiles(site, branch) {
    return this.fetch(`site/${site.id}/published-branch/${branch}/published-file`);
  },

  fetchSites() {
    return this.fetch('site');
  },

  fetchUser() {
    return this.fetch('me');
  },

  addUserToSite({ owner, repository }) {
    return this.fetch('site/user', {
      method: 'POST',
      data: {
        owner,
        repository,
      },
    }, {
      // we want to handle the error elsewhere in order
      // to show the additional AddSite fields
      handleHttpError: false,
    });
  },

  removeUserFromSite(siteId, userId) {
    return this.fetch(`site/${siteId}/user/${userId}`, { method: 'DELETE' });
  },

  addSite(site) {
    return this.fetch('site', {
      method: 'POST',
      data: site,
    });
  },

  updateSite(site, data) {
    return this.fetch(`site/${site.id}`, {
      method: 'PUT',
      data,
    });
  },

  deleteSite(siteId) {
    return this.fetch(`site/${siteId}`, {
      method: 'DELETE',
    });
  },

  restartBuild(buildId, siteId) {
    return this.fetch('build/', {
      method: 'POST',
      data: {
        buildId,
        siteId,
      },
    });
  },

  createBuild(sha, branch, siteId) {
    return this.fetch('build/', {
      method: 'POST',
      data: {
        sha,
        siteId,
        branch,
      },
    });
  },
};
