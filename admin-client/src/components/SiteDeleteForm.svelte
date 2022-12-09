<script>
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';
  import SectionHeader from './SectionHeader.svelte';

  export let site;

  const dispatch = createEventDispatcher();
  let submitting = false;

  function handleCancel() {
    submitting = false;
  }

  function handleSubmit() {
    submitting = true;
  }

  function handleVerification() {
    return dispatch('submit');
  }
</script>

<form
  class="usa-form width-full maxw-none padding-1"
  on:submit|preventDefault={handleSubmit}>
  <fieldset class="usa-fieldset">
    <legend>
      This will perform a soft delete of a cloud.gov Pages site and remove the Cloud
      Foundry route and AWS bucket associated with it.
    </legend>
    <input
      class="usa-button usa-button--secondary"
      type="submit"
      value="Delete"
      disabled={submitting} />
  </fieldset>
</form>

{#if submitting === true}
  <Modal>
    <form
      class="usa-form width-full maxw-mobile-lg padding-1"
      on:submit|preventDefault={handleVerification}>
      <fieldset class="usa-fieldset">
        <legend>
          Are you sure you want to delete site
          <span class="font-code-sm bg-base-lightest padding-x-05">
            {site.repository}
          </span>
          ?
        </legend>
        <div class="grid-row">
          <input
            class="usa-button usa-button--secondary"
            type="submit"
            value="Verify and delete" />
          <input
            class="usa-button usa-button--base"
            type="reset"
            value="Cancel"
            on:click|preventDefault={handleCancel} />
        </div>
      </fieldset>
    </form>
  </Modal>
{/if}
