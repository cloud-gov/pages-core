/* global window:true */

import fetch from './fetch';
import alertActions from '../actions/alertActions';

export const API = '/v0';

function request(endpoint, params = {}, { handleHttpError = true } = {}) {
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
}

export default {
  request,

  fetchBuilds(site) {
    return request(`site/${site.id}/build`);
  },

  fetchBuildLogs(build, page = 1) {
    return request(`build/${build.id}/log/page/${page}`);
  },

  fetchOrganization(id) {
    return request(`organization/${id}`);
  },

  fetchOrganizations() {
    return request('organization');
  },

  fetchOrganizationRoles() {
    return request('organization-role');
  },

  inviteToOrganization(id, data) {
    return request(`organization/${id}/invite`, {
      method: 'POST',
      data,
    });
  },

  updateOrganizationRole(organizationId, roleId, userId) {
    return request('organization-role', {
      method: 'PUT',
      data: {
        organizationId,
        roleId,
        userId,
      },
    });
  },

  removeOrganizationRole(organizationId, userId) {
    return request('organization-role', {
      method: 'DELETE',
      data: {
        organizationId,
        userId,
      },
    });
  },

  fetchRoles() {
    return request('role');
  },

  fetchOrganizationMembers(id) {
    return request(`organization/${id}/members`);
  },

  fetchPublishedBranches(site) {
    return request(`site/${site.id}/published-branch`);
  },

  fetchPublishedFiles(site, branch, startAtKey = null) {
    let path = `site/${site.id}/published-branch/${branch}/published-file`;
    if (startAtKey) {
      path += `?startAtKey=${startAtKey}`;
    }
    return request(path);
  },

  fetchSites() {
    return request('site');
  },

  fetchUser() {
    return request('me');
  },

  fetchUserActions(siteId) {
    return request(`site/${siteId}/user-action`);
  },

  addUserToSite({ owner, repository }) {
    return request('site/user', {
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
    return request(
      `site/${siteId}/user/${userId}`,
      { method: 'DELETE' },
      { handleHttpError: false }
    );
  },

  addSite(site) {
    return request('site', {
      method: 'POST',
      data: site,
    }, {
      handleHttpError: false,
    });
  },

  updateSite(site, data) {
    return request(`site/${site.id}`, {
      method: 'PUT',
      data,
    }, {
      handleHttpError: false,
    });
  },

  deleteSite(siteId) {
    return request(`site/${siteId}`,
      { method: 'DELETE' },
      { handleHttpError: false });
  },

  restartBuild(buildId, siteId) {
    return request('build/', {
      method: 'POST',
      data: {
        buildId,
        siteId,
      },
    });
  },

  createBuild(sha, branch, siteId) {
    return request('build/', {
      method: 'POST',
      data: {
        sha,
        siteId,
        branch,
      },
    });
  },

  updateSiteUser(siteId, data) {
    return request(`site/${siteId}/notifications`, {
      method: 'PUT',
      data,
    }, {
      handleHttpError: false,
    });
  },

  fetchUserEnvironmentVariables(siteId) {
    return request(`site/${siteId}/user-environment-variable`);
  },

  deleteUserEnvironmentVariable(siteId, uevId) {
    return request(`site/${siteId}/user-environment-variable/${uevId}`, {
      method: 'DELETE',
    }, {
      handleHttpError: false,
    });
  },

  createUserEnvironmentVariable(siteId, uev) {
    return request(`site/${siteId}/user-environment-variable`, {
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
    return request(`site/${siteId}/basic-auth`, {
      method: 'DELETE',
    }, {
      handleHttpError: false,
    });
  },

  saveBasicAuthToSite(siteId, credentials) {
    return request(`site/${siteId}/basic-auth`, {
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
