/* global window:true */

import fetch from './fetch';
import alertActions from '../actions/alertActions';

export const API = '/v0';

export default {
  fetch(endpoint, params = {}, { handleHttpError = true } = {}) {
    const csrfToken = typeof window !== 'undefined'
      ? window.CSRF_TOKEN : global.CSRF_TOKEN;

    const defaultHeaders = {
      'x-csrf-token': csrfToken,
    };

    const url = `${API}/${endpoint}`;

    const headers = { ...defaultHeaders, ...params.headers || {} };
    const finalParams = { ...params, headers };

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

  fetchBuildLogs(build, page = 1) {
    return this.fetch(`build/${build.id}/log/page/${page}`);
  },

  fetchPublishedBranches(site) {
    return this.fetch(`site/${site.id}/published-branch`);
  },

  fetchPublishedFiles(site, branch, startAtKey = null) {
    let path = `site/${site.id}/published-branch/${branch}/published-file`;
    if (startAtKey) {
      path += `?startAtKey=${startAtKey}`;
    }
    return this.fetch(path);
  },

  fetchSites() {
    return this.fetch('site');
  },

  fetchUser() {
    return this.fetch('me');
  },

  fetchUserActions(siteId) {
    return this.fetch(`site/${siteId}/user-action`);
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
    return this.fetch(
      `site/${siteId}/user/${userId}`,
      { method: 'DELETE' },
      { handleHttpError: false }
    );
  },

  addSite(site) {
    return this.fetch('site', {
      method: 'POST',
      data: site,
    }, {
      handleHttpError: false,
    });
  },

  updateSite(site, data) {
    return this.fetch(`site/${site.id}`, {
      method: 'PUT',
      data,
    }, {
      handleHttpError: false,
    });
  },

  deleteSite(siteId) {
    return this.fetch(`site/${siteId}`,
      { method: 'DELETE' },
      { handleHttpError: false });
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

  updateSiteUser(siteId, data) {
    return this.fetch(`site/${siteId}/notifications`, {
      method: 'PUT',
      data,
    }, {
      handleHttpError: false,
    });
  },

  fetchUserEnvironmentVariables(siteId) {
    return this.fetch(`site/${siteId}/user-environment-variable`);
  },

  deleteUserEnvironmentVariable(siteId, uevId) {
    return this.fetch(`site/${siteId}/user-environment-variable/${uevId}`, {
      method: 'DELETE',
    }, {
      handleHttpError: false,
    });
  },

  createUserEnvironmentVariable(siteId, uev) {
    return this.fetch(`site/${siteId}/user-environment-variable`, {
      method: 'POST',
      data: {
        name: uev.name,
        value: uev.value,
      },
    }, {
      handleHttpError: false,
    });
  },

  removeBasicAuthFromSite(siteId) {
    return this.fetch(`site/${siteId}/basic-auth`, {
      method: 'DELETE',
    }, {
      handleHttpError: false,
    });
  },

  saveBasicAuthToSite(siteId, credentials) {
    return this.fetch(`site/${siteId}/basic-auth`, {
      method: 'POST',
      data: {
        username: credentials.username,
        password: credentials.password,
      },
    }, {
      handleHttpError: false,
    });
  },

};
