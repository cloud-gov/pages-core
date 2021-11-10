<script>
  import { afterUpdate, createEventDispatcher } from 'svelte';
  import { RadioInput } from '.';

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
    const { containerSize, containerName, active } = event.target.elements;

    dispatch('submit', {
      containerConfig: {
        size: replaceDefault(containerSize.value),
        name: replaceDefault(containerName.value),
      },
      isActive: active.value === 'active',
    });
  }

  afterUpdate(() => { submitting = false; });
</script>

<div class="grid-row">
  <form
    class="usa-form padding-1 grid-col-8 grid-offset-4"
    on:submit|preventDefault={handleSubmit}
  >
    <h3 class="margin-0">Site Status</h3>
    <fieldset class="usa-fieldset">
      <legend class="usa-legend usa-legend">Is this site active?</legend>
      <RadioInput
        label="Build Container Name"
        name="active"
        options={['active', 'inactive']}
        value={site.isActive ? 'active' : 'inactive'}
      />
    </fieldset>
    <br/>
    <h3 class="margin-0">Build Container Configuration</h3>
    <fieldset class="usa-fieldset">
      <legend class="usa-legend">Build Container Size</legend>
      <RadioInput
        label="Build Container Name"
        name="containerSize"
        options={buildContainerSizes}
        value={(site.containerConfig || {}).size || 'default'}
      />
    </fieldset>

    <fieldset class="usa-fieldset">
      <legend class="usa-legend">Build Container Name</legend>
      <RadioInput
        label="Build Container Name"
        name="containerName"
        options={buildContainerNames}
        value={(site.containerConfig || {}).name || 'default'}
      />
    </fieldset>
    <input class="usa-button" type="submit" value="Save" disabled={submitting}>
  </form>
</div>
