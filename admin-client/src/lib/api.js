/* eslint-disable no-console */
/* global API_URL */
import { notification } from '../stores';
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
async function _fetch(path, query) {
  const searchString = _setSearchString(query);
  const qs = searchString !== '' ? `?${searchString}` : '';

  return fetch(`${apiUrl}/admin${path}${qs}`, defaultOptions)
    .then((r) => {
      if (r.ok) return r.json();
      if (r.status === 401) {
        authLogout();
        return null;
      }
      throw r;
    })
    .catch((e) => {
      notification.setError(`API request failed: ${e.message}`);
      console.error(e);
      throw e;
    });
}

async function fetchMe() {
  return _fetch('/me');
}

async function fetchBuilds(query = {}) {
  return _fetch('/builds', query).catch(() => []);
}

async function fetchSites(query = {}) {
  return _fetch('/sites', query).catch(() => []);
}

async function logout() {
  return _fetch('/logout').catch(() => null);
}

export {
  fetchMe,
  fetchBuilds,
  fetchSites,
  logout,
};
