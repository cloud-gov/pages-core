<script>
  import { goto } from "@sapper/app";
  export let user;
  export let notification;
</script>

<button
  class="usa-nav__link"
  on:click|preventDefault={() => {
    user.logout();
    notification.setSuccess('You have been logged out. See you soon!');
    return goto('/');
  }}>
  <span>Logout</span>
</button>
