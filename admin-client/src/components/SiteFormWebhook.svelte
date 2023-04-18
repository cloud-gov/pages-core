<script>
  import Form from './Form.svelte';

  export let site;
  export let onSubmit;
  export let onSuccess;
  export let onFailure;
</script>

<div class="grid-row">
  <div class="grid-col-8 grid-offset-4">
    <Form
      action="Save"
      onSubmit={() => onSubmit(site.id)}
      {onSuccess}
      {onFailure}
    >
      <fieldset class="usa-fieldset">
        <legend class="usa-legend usa-legend">Site Webhook</legend>
      </fieldset>
    </Form>
  </div>
</div>
