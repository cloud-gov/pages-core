<script>
  import { notification } from '../stores';
  import * as api from '../lib/api';
  import { logout as authLogout } from '../lib/auth';

  async function logout() {
    await api.logout();
    authLogout();
    notification.setSuccess('You are now logged out, come back soon!');
  }
</script>

<style>
  button.usa-nav__link {
    color: #ffffff;
    font-weight: normal;
    cursor: pointer;
  }
  button.usa-nav__link:hover::after {
    background-color: #ffffff;
  }
</style>

<button
  class="usa-nav__link"
  on:click|preventDefault={logout}>
  <span>Logout</span>
</button>
