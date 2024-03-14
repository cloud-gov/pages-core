<script>
  import Form from './Form.svelte';
  import SelectInput from './SelectInput.svelte';

  export let buildTaskTypes;
  export let site;
  export let onSubmit;
  export let onSuccess;
  export let onFailure;

  const options = buildTaskTypes?.map((btt) => ({
    value: btt.id,
    label: btt.name,
    id: btt.id,
  }));

  const branches = site.SiteBranchConfigs
    .map((sbc) => sbc.branch)
    .filter(Boolean)
    .map((b) => ({ value: b, id: b, label: b }));

  $: value = undefined;
  $: branch = undefined;
</script>

<div class="grid-row">
  <div class="grid-col-8 grid-offset-4">
    <Form
      action="Add"
      onSubmit={() => onSubmit(value, branch)}
      {onSuccess}
      {onFailure}
      let:errors
    >
      <fieldset class="usa-fieldset">
        <legend class="usa-legend usa-legend">Add New Build Task</legend>
        <SelectInput
          error={errors.isActive}
          name="build-task-types"
          label='Build Task Types'
          options={options}
          bind:value={value}
        />
        <SelectInput
          error={errors.isActive}
          name="branch"
          label='Branch'
          options={branches}
          bind:value={branch}
        />

      </fieldset>
    </Form>
  </div>
</div>
