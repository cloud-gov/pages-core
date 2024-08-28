<script>
  import Form from './Form.svelte';
  import Modal from './Modal.svelte';
  import NumberInput from './NumberInput.svelte';

  export let branch;
  export let buildTaskName;
  export let id;
  export let initialRunDay;
  export let runDay;
  export let closeModal;
  export let onSubmit;
  export let onSuccess;
  export let onFailure;
</script>


{#if buildTaskName && id}
  <Modal>
    <div class="display-flex flex-column flex-align-end">
      <button
        class="usa-button usa-button--base"
        on:click|preventDefault={() => closeModal()}
      >
        Close
      </button>
    </div>
    <Form
      action="Edit"
      disabled={initialRunDay === runDay}
      onSubmit={() => onSubmit(id, runDay)}
      {onSuccess}
      {onFailure}
      let:errors
    >
      <fieldset class="usa-fieldset">
        <p class="font-sans-lg">
          Edit the <span class="text-bold">{buildTaskName}</span>
          running on the
          <span class="font-code-lg bg-base-lightest padding-x-1">{branch}</span> branch.
        </p>
        <NumberInput
          error={errors.isActive}
          name="run-day"
          label="Select day of the month to run report. (Choose a number
          from 1 to 27)"
          min={1}
          max={27}
          bind:value={runDay}
        />
      </fieldset>
    </Form>
  </Modal>
  {/if}
