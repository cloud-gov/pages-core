<script>
  export let action;
  export let options = [];
  export let onAction;
  let updateable = false;

  function handleSubmit() {
    const selected = options.reduce(
      (accumulated, current) => ({
        ...accumulated,
        [current.name]: current.selected,
      }),
      {},
    );
    return onAction(selected);
  }

  function enableUpdate() {
    updateable = true;
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  {#each options as opt}
    <select
      bind:value={opt.selected}
      on:blur|preventDefault={enableUpdate}
      on:change|preventDefault={enableUpdate}
    >
      {#each opt.values as value}
        <option value={value.id}>{value.name}</option>
      {/each}
    </select>
  {/each}
  <button
    class="
      usa-button
      usa-button--primary
      padding-x-1
      padding-y-05
    "
    disabled={!updateable}
    type=submit
  >
    {action}
  </button>
</form>
