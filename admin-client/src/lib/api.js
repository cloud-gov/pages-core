/* eslint-disable no-console */
/* global fetch API_URL */
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
async function _fetch(path) {
  return fetch(`${apiUrl}/admin${path}`, defaultOptions)
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

export async function fetchMe() {
  return _fetch('/me');
}

export async function fetchBuilds() {
  return _fetch('/builds').catch(() => []);
}

export async function fetchSites() {
  return _fetch('/sites').catch(() => []);
}

export async function logout() {
  return _fetch('/logout').catch(() => null);
}

export default {
  fetchBuilds,
  fetchMe,
  fetchSites,
  logout,
};
