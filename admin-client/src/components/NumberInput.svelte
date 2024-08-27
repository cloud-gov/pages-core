<script>
  export let error;
  export let hint;
  export let id;
  export let label;
  export let name;
  export let required = false;
  export let value;
  export let min;
  export let max;

  $: idValue = id ?? name;
  $: errorMessageId = `${idValue}-error-message`;
</script>

<label class="usa-label" for={idValue}>
  {label}{#if required}<abbr title="required" class="usa-hint usa-hint--required">*</abbr>{/if}
</label>
{#if hint}
  <span class="usa-hint">{hint}</span>
{/if}
{#if error}
  <span id={errorMessageId} class="usa-error-message">{error}</span>
{/if}
<input
  class="usa-select"
  name={name}
  id={idValue}
  type="number"
  min={min}
  max={max}
  {required}
  bind:value={value}
/>
