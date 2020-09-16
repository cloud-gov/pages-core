import { notification } from '../stores';
import * as api from '../lib/api';
import { logout as authLogout } from '../lib/auth';

async function logout() {
  await api.logout();
  authLogout();
  notification.setSuccess('You are now logged out, come back soon!');
}

export default logout;
