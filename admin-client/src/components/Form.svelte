<script>
  import { afterUpdate } from 'svelte';

  export let action = 'Save';
  export let onFailure;
  export let onSubmit;
  export let onSuccess;
  export let title = 'Form';

  let submitting = false;
  let errors = {};

  $: hasErrors = Object.keys(errors).length > 0;

  async function handleSubmit() {
    errors = {};
    submitting = true;

    try {
      const result = await onSubmit();
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      if (error.errors) {
        errors = error.errors;
      }
      if (onFailure) {
        onFailure();
      }
    }
  }

  afterUpdate(() => { submitting = false; });
</script>

<form
  class="usa-form usa-form--large"
  on:submit|preventDefault={handleSubmit} >

  <fieldset class="usa-fieldset">
    <legend class="usa-legend usa-legend--large">
      {title}
    </legend>

    <p>
      Required fields are marked with an asterisk (<abbr title="required" class="usa-hint usa-hint--required">*</abbr>).
    </p>
    
    {#if hasErrors}
      <div class="usa-alert usa-alert--error usa-alert--slim">
        <div class="usa-alert__body">
          <p class="usa-alert__text">
            Sorry, there was a problem, see below for details.
          </p>
        </div>
      </div>
    {/if}

    <slot {errors}></slot>

    <input class="usa-button" type="submit" value={action} disabled={submitting}>
  </fieldset>
</form>

<style>
  /*
   * This is the max-width of the form but if it is not set it can expand and
   * be wonky when an error is present
  */
  form {
    width: 30rem;
  }
</style>