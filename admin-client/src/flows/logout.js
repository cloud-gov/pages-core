import { notification } from '../stores';
import { deauthenticate, logout as authLogout } from '../lib/auth';

async function logout() {
  try {
    authLogout();
    await deauthenticate();
    notification.setSuccess('You are now logged out, come back soon!');
  } catch (err) {
    notification.setError(`Could not log out. Error: ${err}`);
  }
}

export default logout;
