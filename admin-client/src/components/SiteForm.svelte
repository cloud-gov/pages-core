<script>
  import Form from './Form.svelte';
  import RadioInput from './RadioInput.svelte';

  export let site;
  export let onSubmit;
  export let onSuccess;

  const buildContainerNames = [
    { label: 'default', value: '' },
    'exp',
  ];
  
  const buildContainerSizes = [
    { label: 'default', value: '' },
    'large',
  ];
  
  const siteStatuses = [
    { label: 'active', value: true },
    { label: 'inactive', value: false },
  ];
</script>

<div class="grid-row">
  <div class="grid-col-8 grid-offset-4">
    <Form
      action="Update"
      onSubmit={() => onSubmit(site)}
      {onSuccess}
      let:errors={errors}>

      <fieldset class="usa-fieldset">
        <legend class="usa-legend usa-legend">Site Status</legend>
        <RadioInput
          error={errors.isActive}
          name="active"
          options={siteStatuses}
          bind:value={site.isActive}
        />
      </fieldset>

      <fieldset class="usa-fieldset">
        <legend class="usa-legend">Build Container Size</legend>
        <RadioInput
          error={errors?.containerConfig?.size}
          name="containerSize"
          options={buildContainerSizes}
          bind:value={site.containerConfig.size}
          tile={true}
        />
      </fieldset>

      <fieldset class="usa-fieldset">
        <legend class="usa-legend">Build Container Name</legend>
        <RadioInput
          error={errors?.containerConfig?.name}
          name="containerName"
          options={buildContainerNames}
          bind:value={site.containerConfig.name}
          tile={true}
        />
      </fieldset>
    </Form>
  </div>
</div>
