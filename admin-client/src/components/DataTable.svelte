<script>
  export let data;
  export let borderless = false;
</script>

{#if data.length > 0}
  <div class="usa-table-container--scrollable">
    <table
      class="usa-table usa-table--compact width-full"
      class:usa-table--borderless={borderless}
    >
      <thead>
        <slot name="header"></slot>
      </thead>
      <tbody>
        {#each data as item}
          <slot name="item" {item}></slot>
        {/each}
      </tbody>
    </table>  
  </div>
{:else}
  <p>No data found.</p>
{/if}

<style>
  :global(.usa-table tbody tr:hover td) {
    background-color: #f5f5f5;
  }
</style>