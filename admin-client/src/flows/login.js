import { notification } from '../stores';
import { fetchMe } from '../lib/api';
import { authenticate, login as authLogin } from '../lib/auth';

async function login() {
  try {
    await authenticate();
    const user = await fetchMe();
    authLogin(user);
  } catch (err) {
    notification.setError(`Could not log into site. Error: ${err}`);
  }
}

export default login;
