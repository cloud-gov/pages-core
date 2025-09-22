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

function _setSearchString(query = {}) {
  const search = new URLSearchParams();

  Object.keys(query).map((key) => {
    search.set(key, query[key]);
  });
  return search.toString();
}

async function _fetch(
  path,
  fetchOpts = {},
  apiOpts = {
    handleError: true,
  },
) {
  const fetchOptions = {
    ...defaultOptions,
    ...fetchOpts,
  };
  if (!['GET', 'HEAD', 'OPTIONS'].includes(fetchOptions.method)) {
    fetchOptions.headers['x-csrf-token'] = session.csrfToken();
  }

  let request = fetch(`${apiUrl}/admin${path}`, fetchOptions).then(async (r) => {
    if (r.ok) return r.json();
    if (r.status === 401) {
      authLogout();
      return null;
    }
    if (r.status === 422) {
      const json = await r.json();
      const error = new Error(json.message || r.statusText);
      error.errors = json.errors;
      throw error;
    }
    throw new Error(r.statusText);
  });

  if (apiOpts.handleError) {
    request = request.catch((e) => {
      notification.setError(`API request failed: ${e.message}`);
      console.error(e);
      throw e;
    });
  }

  return request;
}

async function _fetchAttachedFile(path) {
  const fetchOptions = {
    ...defaultOptions,
  };
  fetchOptions.headers['x-csrf-token'] = session.csrfToken();

  let request = fetch(`${apiUrl}/admin${path}`, fetchOptions).then(async (r) => {
    if (r.ok) return r.text();
    if (r.status === 401) {
      authLogout();
      return null;
    }
    if (r.status === 422) {
      const json = await r.json();
      const error = new Error(json.message || r.statusText);
      error.errors = json.errors;
      throw error;
    }
    throw new Error(r.statusText);
  });

  request = request.catch((e) => {
    notification.setError(`API request failed: ${e.message}`);
    console.error(e);
    throw e;
  });

  return request;
}

function destroy(path, body) {
  return _fetch(path, {
    method: 'DELETE',
    body: JSON.stringify(body),
  });
}

function get(path, query) {
  let qs = '';
  if (query) {
    const searchString = _setSearchString(query);
    qs = searchString !== '' ? `?${searchString}` : '';
  }
  return _fetch(path + qs);
}

function getAttachedFile(path) {
  return _fetchAttachedFile(path);
}

function post(path, body = {}, opts = {}) {
  return _fetch(
    path,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    opts,
  );
}

function put(path, body) {
  return _fetch(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

async function destroySite(id) {
  return destroy(`/sites/${id}`);
}

async function fetchMe() {
  return get('/me');
}

function fetchBuildLogEventSource(id, onMessage) {
  const es = new EventSource(`${apiUrl}/admin/builds/${id}/log`, {
    withCredentials: true,
  });
  es.addEventListener('message', onMessage);
  es.addEventListener('error', (error) => {
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

async function rebuildBuild(body) {
  return post('/builds', body);
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

async function createDomain(params) {
  return post('/domains', params, { handleError: false });
}

async function fetchDomain(id) {
  return get(`/domains/${id}`).catch(() => null);
}

async function fetchDomainDns(id) {
  return get(`/domains/${id}/dns`).catch(() => null);
}

async function fetchDomainDnsResult(id) {
  return get(`/domains/${id}/dns-result`).catch(() => null);
}

async function fetchDomains(query = {}) {
  return get('/domains', query).catch(() => []);
}

async function provisionDomain(id) {
  return post(`/domains/${id}/provision`);
}

async function deprovisionDomain(id) {
  return post(`/domains/${id}/deprovision`);
}

async function destroyDomain(id) {
  return post(`/domains/${id}/destroy`);
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

async function fetchOrganizationsReport(query = {}) {
  return get('/reports/organizations', query).catch(() => []);
}

async function fetchOrganizationsReportCSV() {
  return getAttachedFile('/reports/organizations.csv').catch(() => []);
}

async function fetchPublishedSitesReport(query = {}) {
  return get('/reports/published-sites', query).catch(() => []);
}

async function fetchPublishedSitesReportCSV() {
  return getAttachedFile('/reports/published-sites.csv').catch(() => []);
}

async function updateOrganization(id, params) {
  return put(`/organizations/${id}`, params);
}

async function deactivateOrganization(id) {
  return post(`/organizations/${id}/deactivate`);
}

async function activateOrganization(id) {
  return post(`/organizations/${id}/activate`);
}

async function fetchRoles() {
  return get('/roles').catch(() => []);
}

async function removeUserOrgRole({ userId, organizationId }) {
  return destroy(`/organization/${organizationId}/user/${userId}`);
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

async function createSiteWebhook(id) {
  return post(`/sites/${id}/webhooks`);
}

async function fetchSiteWebhooks(id) {
  return get(`/sites/${id}/webhooks`).catch(() => null);
}

async function createSiteFileStorage(id) {
  return post(`/sites/${id}/file-storage`);
}

async function fetchSiteFileStorage(id) {
  return get(`/sites/${id}/file-storage`);
}

async function fetchSiteFileStorageUserActions(query = {}, id) {
  return get(`/site-file-storage/${id}/user-actions`, query).catch(() => []);
}

async function fetchRawSites() {
  return get('/sites/raw').catch(() => []);
}

async function updateSite(id, params) {
  return put(`/sites/${id}`, params);
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

async function fetchUsersReport(query = {}) {
  return get('/reports/users', query).catch(() => []);
}

async function fetchUsersReportCSV() {
  return getAttachedFile('/reports/users.csv').catch(() => []);
}

async function fetchActiveUsersReport(query = {}) {
  return get('/reports/active-users', query).catch(() => []);
}

async function fetchActiveUsersReportCSV() {
  return getAttachedFile('/reports/active-users.csv').catch(() => []);
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

async function fetchTasks(query = {}) {
  return get('/tasks', query).catch(() => []);
}

async function fetchBuildTaskTypes() {
  return get('/tasks/types').catch(() => []);
}

async function addSiteBuildTask(id, params) {
  return post(`/sites/${id}/tasks`, params);
}

async function updateSiteBuildTask(id, params) {
  return put(`/site-build-tasks/${id}`, params);
}

async function removeBuildTask(id) {
  return destroy(`/site-build-tasks/${id}`);
}

export {
  addSiteBuildTask,
  updateSiteBuildTask,
  removeBuildTask,
  destroySite,
  fetchMe,
  fetchBuildLogEventSource,
  fetchBuild,
  rebuildBuild,
  updateBuild,
  fetchBuilds,
  fetchBuildLog,
  createDomain,
  fetchDomain,
  fetchDomains,
  fetchDomainDns,
  fetchDomainDnsResult,
  provisionDomain,
  deprovisionDomain,
  destroyDomain,
  fetchEvents,
  createOrganization,
  fetchOrganization,
  fetchOrganizations,
  fetchOrganizationsReport,
  fetchOrganizationsReportCSV,
  fetchPublishedSitesReport,
  fetchPublishedSitesReportCSV,
  updateOrganization,
  deactivateOrganization,
  activateOrganization,
  removeUserOrgRole,
  updateUserOrgRole,
  fetchRoles,
  fetchSite,
  fetchSites,
  createSiteWebhook,
  fetchSiteWebhooks,
  fetchRawSites,
  fetchUserEnvironmentVariables,
  fetchUser,
  fetchUsers,
  fetchUsersReport,
  fetchUsersReportCSV,
  fetchActiveUsersReport,
  fetchActiveUsersReportCSV,
  inviteUser,
  resendInvite,
  logout,
  updateSite,
  fetchTasks,
  fetchBuildTaskTypes,
  fetchSiteFileStorage,
  createSiteFileStorage,
  fetchSiteFileStorageUserActions,
};
