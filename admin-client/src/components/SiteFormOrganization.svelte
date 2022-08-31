<script>
  import Form from './Form.svelte';
  import SelectInput from './SelectInput.svelte';

  export let site;
  export let orgs;
  export let onSubmit;
  export let onSuccess;
  export let onFailure;

  const siteOrg = orgs?.data?.find((org) => org.id === site.organizationId);
  const orgOptions = orgs?.data?.map((org) => ({
    value: org.id,
    label: org.name,
    id: org.id,
  }));

  $: value = siteOrg?.id || '';
</script>

<div class="grid-row">
  <div class="grid-col-8 grid-offset-4">
    <Form
      action="Update"
      disabled={value === siteOrg?.id || !value}
      onSubmit={() => onSubmit(value, site.id)}
      {onSuccess}
      {onFailure}
      let:errors
    >
      <fieldset class="usa-fieldset">
        <legend class="usa-legend usa-legend">Site Organization</legend>
        <SelectInput
          error={errors.isActive}
          name="Organization"
          label='Organizations'
          options={orgOptions}
          bind:value={value}
        />
      </fieldset>
    </Form>
  </div>
</div>
