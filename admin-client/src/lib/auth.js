/* global API_URL */
import page from 'page';
import { session } from '../stores';

const apiUrl = API_URL;

const calcWindow = () => ({
  width: 600,
  height: 600,
  left: window.screen.width / 2 - 600 / 2,
  top: window.screen.height / 2 - 600 / 2,
});

async function authenticate() {
  return new Promise((resolve, reject) => {
    const {
      width, height, top, left,
    } = calcWindow();

    const authWindow = window.open(
      `${apiUrl}/admin/auth/github`,
      'Federalist Admin Auth',
      `width=${width}, height=${height}, top=${top}, left=${left}`,
    );

    window.addEventListener('message', (e) => {
      if (e.origin === apiUrl && e.data === 'success') {
        authWindow.close();
        return resolve(true);
      }
      return reject(new Error('Authentication failed'));
    }, { once: true });

    authWindow.focus();
  });
}

function init() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      session.login(user);
    }
  } catch (_) {
    // do nothing
  }
}

function login(user) {
  localStorage.setItem('user', JSON.stringify(user));
  session.login(user);
  page.redirect('/');
}

function logout() {
  localStorage.removeItem('user');
  session.logout();
  page('/login');
}

export {
  authenticate,
  init,
  login,
  logout,
};
