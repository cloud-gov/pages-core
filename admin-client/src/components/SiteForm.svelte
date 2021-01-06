<script>
  import { afterUpdate, createEventDispatcher } from 'svelte';
  import SectionHeader from './SectionHeader.svelte';

  export let site;
  
  let submitting = false;

  const dispatch = createEventDispatcher();

  const buildContainerNames = ['default', 'exp'];
  const buildContainerSizes = ['default', 'large'];

  function replaceDefault(val) {
    return val === 'default' ? '' : val;
  }
  
  function handleSubmit(event) {
    submitting = true;
    const { containerSize, containerName } = event.target.elements;

    dispatch('submit', {
      containerConfig: {
        size: replaceDefault(containerSize.value),
        name: replaceDefault(containerName.value),
      },
    });
  }

  afterUpdate(() => { submitting = false; });
</script>

<div class="grid-row">
  <form
    class="usa-form padding-1 grid-col-8 grid-offset-4"
    on:submit|preventDefault={handleSubmit}
  >
    <h3 class="margin-0">Build Container Configuration</h3>
    <fieldset class="usa-fieldset">
      <legend class="usa-legend">Build Container Size</legend>
      {#each buildContainerSizes as buildContainerSize}
        <div class="usa-radio">
          <input
            class="usa-radio__input usa-radio__input--tile"
            type="radio"
            name="containerSize"
            id={buildContainerSize}
            value={buildContainerSize}
            checked={((site.containerConfig || {}).size || 'default') === buildContainerSize}>
          <label class="usa-radio__label" for={buildContainerSize}>{buildContainerSize}</label>
        </div>
      {/each}
    </fieldset>

    <fieldset class="usa-fieldset">
      <legend class="usa-legend">Build Container Name</legend>
      {#each buildContainerNames as buildContainerName}
        <div class="usa-radio">
          <input
            class="usa-radio__input usa-radio__input--tile"
            type="radio"
            name="containerName"
            id={buildContainerName}
            value={buildContainerName}
            checked={((site.containerConfig || {}).name || 'default') === buildContainerName}>
          <label class="usa-radio__label" for={buildContainerName}>{buildContainerName}</label>
        </div>
      {/each}
    </fieldset>
    <input class="usa-button" type="submit" value="Save" disabled={submitting}>
  </form>
</div>
