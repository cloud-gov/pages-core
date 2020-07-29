<script>
  import { notification } from '../stores';
  import api from '../lib/api';
  import { logout as authLogout } from '../lib/auth';

  async function logout() {
    await api.logout();
    authLogout();
    notification.setSuccess('You are now logged out, come back soon!');
  }
</script>

<button
  class="usa-nav__link"
  on:click|preventDefault={logout}>
  <span>Logout</span>
</button>
