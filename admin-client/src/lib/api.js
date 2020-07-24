import { stores } from '@sapper/app';
import { notification } from '../stores';

const { session } = stores();
const { REDIRECT_BASE_URL } = $session;

async function _fetch(path) {
  return fetch(`${REDIRECT_BASE_URL}${path}`, {
    mode: 'cors',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(r => r.json())
    .catch((e) => {
      notification.setError(`API request failed: ${e.message}`);
      console.error(e);
    });
}

export async function fetchMe() {
  return _fetch('/admin/me');
}

export default {
  fetchMe,
};
