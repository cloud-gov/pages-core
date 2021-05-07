<script>
  import page from 'page';
  import { afterUpdate } from 'svelte';
  import { router } from '../../stores';
  import { Await, GridContainer } from '../../components';
  import { fetchOrganization, updateOrganization } from '../../lib/api';

  $: id = $router.params.id;
  $: orgPromise = fetchOrganization(id);

  let submitting = false;

  async function handleSubmit(event) {
    submitting = true;
    const { name } = event.target.elements;

    const params = { name: name.value };

    await updateOrganization(id, params);

    page('/organizations');
  }

  afterUpdate(() => { submitting = false; });
</script>

<GridContainer classes={['display-flex', 'flex-justify-center']}>
  <Await on={orgPromise} let:response={org}>
    <form
      class="usa-form usa-form--large"
      on:submit|preventDefault={handleSubmit} >
  
      <legend class="usa-legend usa-legend--large">Edit Organization</legend>
  
      <p>
        Required fields are marked with an asterisk (<abbr title="required" class="usa-hint usa-hint--required">*</abbr>).
      </p>
  
      <fieldset class="usa-fieldset">
        <label class="usa-label" for="name">Organization Name<abbr title="required" class="usa-hint usa-hint--required">*</abbr></label>
        <span class="usa-hint">Organization name must be globally unique</span>
        <input type="text" class="usa-input" name="name" id="name" value={org.name} required>
      </fieldset>
  
      <input class="usa-button" type="submit" value="Update" disabled={submitting}>
    </form>
  </Await>
</GridContainer>