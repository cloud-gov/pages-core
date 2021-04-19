<script>
  import { afterUpdate } from 'svelte';
  import { router } from '../stores';
  import {
    fetchOrganization,
    createOrganization,
    updateOrganization,
  } from '../lib/api';
  import {
    Await,
    ExternalLink,
    GridContainer,
    PageTitle,
    LabeledItem,
  } from '../components';

  $: id = $router.params.id;
  $: orgPromise = id ? fetchOrganization(id) : Promise.resolve({});

  let submitting = false;

  async function handleSubmit(event) {
    submitting = true;
    const { name, managerEmail } = event.target.elements;
    const params = {
      name: name.value,
      managerEmail: managerEmail.value,
    }
    
    const org = await (id ? updateOrganization(id, params) : createOrganization(params));
  }

  afterUpdate(() => { submitting = false; });
</script>

<GridContainer classes={['display-flex', 'flex-justify-center']}>
  <Await on={orgPromise} let:response={org}>
    <form
      class="usa-form usa-form--large"
      on:submit|preventDefault={handleSubmit} >

      <legend class="usa-legend usa-legend--large">{id ? 'Edit' : 'Create'} Organization</legend>

      <div class="usa-alert usa-alert--info usa-alert--validation">
        <div class="usa-alert__body">
          <h3 class="usa-alert__heading">Organization information</h3>
          <p class="usa-alert__text">
            Organization name must be globally unique
          </p>
        </div>
      </div>
  
      <fieldset class="usa-fieldset">
        <label class="usa-label" for="name">Organization Name</label>
        <input type="text" class="usa-input" name="name" id="name" value={org.name || ''} required>
      </fieldset>
      <fieldset class="usa-fieldset">
        <label class="usa-label" for="managerEmail">Organization Manager Email</label>
        <input type="email" class="usa-input" name="managerEmail" id="managerEmail" required>
      </fieldset>

      <input class="usa-button" type="submit" value={ id ? 'Update' : 'Create'} disabled={submitting}>
    </form>
  </Await>
</GridContainer>

<style>

</style>