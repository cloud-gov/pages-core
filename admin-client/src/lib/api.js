/* eslint-disable no-console */
/* global API_URL */
import { notification, session } from '../stores';
import { logout as authLogout } from './auth';

const apiUrl = API_URL;

const defaultOptions = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  mode: 'cors',
};

// eslint-disable-next-line no-underscore-dangle
function _setSearchString(query = {}) {
  const search = new URLSearchParams();

  // eslint-disable-next-line array-callback-return
  Object.keys(query).map((key) => {
    search.set(key, query[key]);
  });
  return search.toString();
}

// eslint-disable-next-line no-underscore-dangle
async function _fetch(path, opts = {}) {
  const options = { ...defaultOptions, ...opts };
  if (!['GET', 'HEAD', 'OPTIONS'].includes(options.method)) {
    options.headers['x-csrf-token'] = session.csrfToken();
  }

  return fetch(`${apiUrl}/admin${path}`, options)
    .then((r) => {
      if (r.ok) return r.json();
      if (r.status === 401) {
        authLogout();
        return null;
      }
      throw new Error(r.statusText);
    })
    .catch((e) => {
      notification.setError(`API request failed: ${e.message}`);
      console.error(e);
      throw e;
    });
}

function destroy(path, body) {
  return _fetch(path, { method: 'DELETE', body: JSON.stringify(body) });
}

function get(path, query) {
  let qs = '';
  if (query) {
    const searchString = _setSearchString(query);
    qs = searchString !== '' ? `?${searchString}` : '';
  }
  return _fetch(path + qs);
}

function post(path, body) {
  return _fetch(path, { method: 'POST', body: JSON.stringify(body) });
}

function put(path, body) {
  return _fetch(path, { method: 'PUT', body: JSON.stringify(body) });
}

async function destroySite(id) {
  return destroy(`/sites/${id}`).catch(() => null);
}

async function fetchMe() {
  return get('/me');
}

function fetchBuildLogEventSource(id, onMessage) {
  const es = new EventSource(`${apiUrl}/admin/builds/${id}/log`, { withCredentials: true });
  es.addEventListener('message', onMessage);
  es.addEventListener('error', (error) => {
    // eslint-disable-next-line no-console
    console.error('EventSource failed:', error);
    if (es) {
      es.close();
    }
  });
  return es;
}

async function fetchBuild(id) {
  return get(`/builds/${id}`).catch(() => null);
}

async function updateBuild(id, params) {
  return put(`/builds/${id}`, params);
}

async function fetchBuilds(query = {}) {
  return get('/builds', query).catch(() => []);
}

async function fetchBuildLog(id) {
  return get(`/builds/${id}/log`).catch(() => null);
}

async function fetchEvents(query = {}) {
  return get('/events', query).catch(() => []);
}

async function createOrganization(params) {
  return post('/organizations', params);
}

async function fetchOrganization(id) {
  return get(`/organizations/${id}`).catch(() => null);
}

async function fetchOrganizations(query = {}) {
  return get('/organizations', query).catch(() => []);
}

async function updateOrganization(id, params) {
  return put(`/organizations/${id}`, params);
}

async function fetchRoles() {
  return get('/roles').catch(() => []);
}

async function removeUserOrgRole(params) {
  return destroy('/organization-role', params);
}

async function updateUserOrgRole(params) {
  return put('/organization-role', params);
}

async function fetchSite(id) {
  return get(`/sites/${id}`).catch(() => null);
}

async function fetchSites(query = {}) {
  return get('/sites', query).catch(() => []);
}

async function updateSite(id, params) {
  return put(`/sites/${id}`, params).catch(() => null);
}

async function fetchUserEnvironmentVariables(query = {}) {
  return get('/user-environment-variables', query).catch(() => []);
}

async function fetchUser(id) {
  return get(`/users/${id}`).catch(() => null);
}

async function fetchUsers(query = {}) {
  return get('/users', query).catch(() => []);
}

async function inviteUser(params) {
  return post('/users/invite', params);
}

async function resendInvite(params) {
  return post('/users/resend-invite', params);
}

async function logout() {
  return get('/logout').catch(() => null);
}

export {
  destroySite,
  fetchMe,
  fetchBuildLogEventSource,
  fetchBuild,
  updateBuild,
  fetchBuilds,
  fetchBuildLog,
  fetchEvents,
  createOrganization,
  fetchOrganization,
  fetchOrganizations,
  updateOrganization,
  removeUserOrgRole,
  updateUserOrgRole,
  fetchRoles,
  fetchSite,
  fetchSites,
  fetchUserEnvironmentVariables,
  fetchUser,
  fetchUsers,
  inviteUser,
  resendInvite,
  logout,
  updateSite,
};
