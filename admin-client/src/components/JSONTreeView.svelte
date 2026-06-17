<script>
  export let data;
  // The top-level node renders open by default; nested objects start collapsed.
  export let open = false;

  // Determine if there is anything meaningful to display.
  $: isEmpty =
    data == null || (typeof data === 'object' && Object.keys(data).length === 0);

  $: isObject = typeof data === 'object' && data !== null;

  // Stable list of [key, value] entries for objects/arrays.
  $: entries = isObject ? Object.entries(data) : [];

  function isNested(value) {
    return typeof value === 'object' && value !== null && Object.keys(value).length > 0;
  }

  function formatPrimitive(value) {
    if (value === null) return 'null';
    if (typeof value === 'string') return value;
    return String(value);
  }
</script>

{#if isEmpty}
  <span class="empty">--</span>
{:else if isObject}
  <details {open}>
    <summary>{Array.isArray(data) ? `Array (${entries.length})` : 'View'}</summary>
    <ul class="tree">
      {#each entries as [key, value] (key)}
        <li>
          <span class="key">{key}:</span>
          {#if isNested(value)}
            <svelte:self data={value} open={false} />
          {:else}
            <span class="value">{formatPrimitive(value)}</span>
          {/if}
        </li>
      {/each}
    </ul>
  </details>
{:else}
  <span class="value">{formatPrimitive(data)}</span>
{/if}

<style>
  details {
    cursor: pointer;
  }

  summary {
    color: #005ea2;
    user-select: none;
  }

  ul.tree {
    list-style: none;
    margin: 0.25rem 0 0;
    padding: 0.5rem 0.75rem;
    background-color: #f0f0f0;
    border-radius: 0.25rem;
    border-left: 2px solid #d0d7de;
    font-family: Consolas, 'Lucida Console', Menlo, monospace;
    font-size: 0.85rem;
    line-height: 1.5;
    /* Let the column grow to fit content instead of the "View" summary. */
    min-width: max-content;
  }

  ul.tree li {
    margin: 0;
    padding: 0.1rem 0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .key {
    color: #6f42c1;
    font-weight: 600;
    margin-right: 0.25rem;
  }

  .value {
    color: #1a1a1a;
  }

  .empty {
    color: #757575;
  }
</style>
