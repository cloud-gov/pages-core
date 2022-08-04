<script>
  export let label = 'label';
  export let value = null;
  export let title = null;
</script>

<p class="margin-y-05">
  <span class="text-semibold text-lowercase text-ls-neg-3 font-sans-2xs">{label}: <span>
  {#if value}
    <span class="text-bold" title={title}>{value}</span>
  {:else}
    <slot />
  {/if}
</p>
