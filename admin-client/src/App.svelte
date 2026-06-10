<script>
  import Nav from './components/Nav.svelte';
  import Banner from './components/Banner.svelte';

  import NotificationAlert from './containers/NotificationAlert.svelte';

  import { router } from './stores';
  import { currentPage } from './stores/router';

  // Derive a stable key from the full path including query string
  $: routeKey = $router.path || '';
</script>

<NotificationAlert />

<Banner />

<Nav />

<main>
  {#if $currentPage}
    {#key routeKey}
      <svelte:component this={$currentPage} />
    {/key}
  {:else}
    <p>Loading...</p>
  {/if}
</main>

<style>
  :global(.grid-container),
  :global(.usa-nav-container),
  :global(.usa-banner__inner) {
    max-width: 72rem;
  }
</style>
