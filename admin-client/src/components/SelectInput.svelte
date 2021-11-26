<script>
  export let error;
  export let hint;
  export let id;
  export let label;
  export let name;
  export let options;
  export let required = false;
  export let value;

  $: idValue = id ?? name;
  $: errorMessageId = `${idValue}-error-message`;
  $: if (!options.map((option) => option.value ?? option).includes(value)) {
    value = '';
  }
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
<select
  class="usa-select"
  name={name}
  id={idValue}
  {required}
  bind:value={value}
>
  <option value="">--</option>
  {#each options as option}
    <option value={option.value ?? option}>{option.label ?? option}</option>
  {/each}
</select>