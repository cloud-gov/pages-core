<script>
  export let error;
  export let hint;
  export let id;
  export let label;
  export let name;
  export let options;
  export let value;

  $: idValue = id ?? name;
  $: errorMessageId = `${idValue}-error-message`;
  $: if (!options.map((option) => option.value ?? option).includes(value)) {
    value = '';
  }

  function getOptionLabel(option) {
    return option.label || option;
  }

  function getOptionValue(option) {
    return option.value || option;
  }

  function getOptionId(option) {
    return option.id || [name, option].join('-');
  }
</script>

{#if hint}
  <span class="usa-hint">{hint}</span>
{/if}
{#if error}
  <span id={errorMessageId} class="usa-error-message">{error}</span>
{/if}
{#each options as option}
  <div class="usa-radio">
    <input
      class="usa-radio__input usa-radio__input--tile"
      type=radio
      id={getOptionId(option)}
      bind:group={value}
      name={name}
      value={getOptionValue(option)}>
    <label class="usa-radio__label" for={getOptionId(option)}>{getOptionLabel(option)}</label>
  </div>
{/each}