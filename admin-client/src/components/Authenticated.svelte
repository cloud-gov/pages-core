<script>
  import { goto } from "@sapper/app";
  import { user } from "../stores";

  export let authenticated = true;
  export let redirectPath = "/";

  async function redirectTo() {
    return await goto(redirectPath);
  }
</script>

{#if $user.isAuthenticated === authenticated}
  <slot />
{:else}{redirectTo()}{/if}
