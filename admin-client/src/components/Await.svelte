<script>
  export let on;
</script>

{#await on}
  <slot name="loading">
    <p>Loading...</p>
  </slot>
{:then response}
  <slot {response}>{response}</slot>
{:catch error}
  <p>Something went wrong: {error.message}</p>
{/await}