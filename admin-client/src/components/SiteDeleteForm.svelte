<script>
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';
  import SectionHeader from './SectionHeader.svelte';

  export let site;

  const dispatch = createEventDispatcher();

  let submitting = false;
  let verifiedMismatch = false;

  function handleCancel() {
    submitting = false;
    verifiedMismatch = false;
  }

  function handleSubmit() {
    submitting = true;
  }

  function handleVerification(event) {
    const { siteNameVerification } = event.target.elements;
    const isVerified = siteNameVerification.value === site.repository;

    if (isVerified) {
      dispatch('submit');
      handleCancel();
    } else {
      verifiedMismatch = true;
    }
  }

  function resetInputError() {
    verifiedMismatch = false;
  }
</script>

<SectionHeader>Delete</SectionHeader>

<form
  class="usa-form width-full maxw-none padding-1"
  on:submit|preventDefault={handleSubmit}>
  <fieldset class="usa-fieldset">
    <legend>
      This will perform a soft delete of a Federalist site and remove the Cloud
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
          Please verify the site's name to delete it. Enter
          <span class="font-code-sm bg-base-lightest padding-x-05">
            {site.repository}
          </span>
          into the input.
        </legend>
        <div class="grid-row">
          <div class="usa-form-group width-full">
            <label class="usa-label" for="container-size">Site name</label>
            <input
              on:input={resetInputError}
              class="usa-input"
              class:usa-input--error={verifiedMismatch}
              id="site-name-verification"
              name="siteNameVerification"
              type="text"
              required
              aria-required="true" />
            {#if verifiedMismatch}
              <span
                class="usa-error-message"
                id="input-error-message"
                role="alert">
                Input name did not match site name.
              </span>
            {/if}
          </div>
        </div>
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
