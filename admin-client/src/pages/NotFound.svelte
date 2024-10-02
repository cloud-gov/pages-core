<script>
  export let status;
  export let error = {};

  const dev = process.env.NODE_ENV === 'development';
</script>

<svelte:head>
  <title>{status}</title>
</svelte:head>

<div
  class="grid-row info-block usa-content padding-y-4 margin-y-4
  desktop:padding-y-7 desktop:margin-y-7">
  <h1 class="text-primary-darker text-bold">{status} / {error.message}</h1>
  <p>
    You might want to double-check your link and try again, or return to the
    <a href="/">homepage</a>
  </p>

  {#if dev && error.stack}
    <pre>{error.stack}</pre>
  {/if}
</div>
