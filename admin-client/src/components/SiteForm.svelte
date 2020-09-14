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

<SectionHeader>
  Config
</SectionHeader>
<form
  class="usa-form width-full maxw-none padding-1"
  on:submit|preventDefault={handleSubmit}
>
  <fieldset class="usa-fieldset">
    <legend class="usa-legend usa-sr-only">Build Container</legend>
    <div class="grid-row">
      <label class="usa-label grid-col" for="container-size">Build Container Size</label>
      <select
        class="usa-select grid-col-4"
        id="container-size"
        name="containerSize"
        value={site.containerConfig.size}
      >
        {#each buildContainerSizes as buildContainerSize}
          <option value={buildContainerSize}>
            {buildContainerSize}
          </option>
        {/each}
      </select>
    </div>        
    <div class="grid-row">
      <label class="usa-label grid-col" for="container-name">Build Container Name</label>
      <select
        class="usa-select grid-col-4"
        id="container-name"
        name="containerName"
        value={site.containerConfig.name}
      >
        {#each buildContainerNames as buildContainerName}
          <option value={buildContainerName}>
            {buildContainerName}
          </option>
        {/each}
      </select>
    </div>     
  </fieldset>
  <input class="usa-button" type="submit" value="Save" disabled={submitting}>
</form>