<script>
  export let on;
</script>

{#await on}
  <p>Loading...</p>
{:then response}
  <slot {response}>{response}</slot>
{:catch error}
  <p>Something went wrong: {error.message}</p>
{/await}