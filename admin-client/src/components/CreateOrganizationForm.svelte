<script>
  import page from 'page';
  import { afterUpdate } from 'svelte';
  import { createOrganization } from '../lib/api';

  let submitting = false;

  async function handleSubmit(event) {
    submitting = true;
    const { name, managerUAAEmail, managerGithubUsername } = event.target.elements;

    const params = {
      name: name.value,
      managerUAAEmail: managerUAAEmail.value,
      managerGithubUsername: managerGithubUsername.value,
    };

    const { invite } = await createOrganization(params);

    if (invite) {
      // eslint-disable-next-line no-alert
      window.alert(`Created invite for ${invite.email}: ${invite.link}`);
    }

    page('/organizations');
  }

  afterUpdate(() => { submitting = false; });
</script>

<form
  class="usa-form usa-form--large"
  on:submit|preventDefault={handleSubmit} >

  <legend class="usa-legend usa-legend--large">Create Organization</legend>

  <p>
    Required fields are marked with an asterisk (<abbr title="required" class="usa-hint usa-hint--required">*</abbr>).
  </p>

  <fieldset class="usa-fieldset">
    <label class="usa-label" for="name">Organization Name<abbr title="required" class="usa-hint usa-hint--required">*</abbr></label>
    <span class="usa-hint">Organization name must be globally unique</span>
    <input type="text" class="usa-input" name="name" id="name" required>
  </fieldset>

  <fieldset class="usa-fieldset">
    <label class="usa-label" for="managerUAAEmail">Organization Manager UAA Email<abbr title="required" class="usa-hint usa-hint--required">*</abbr></label>
    <span class="usa-hint">The user will be created and invited to UAA if necessary.</span>
    <input type="email" class="usa-input" name="managerUAAEmail" id="managerUAAEmail" required>
  </fieldset>

  <fieldset class="usa-fieldset">
    <label class="usa-label" for="managerGithubUsername">Organization Manager Github Username</label>
    <span class="usa-hint">Required to migrate an existing user.</span>
    <input type="text" class="usa-input" name="managerGithubUsername" id="managerGithubUsername">
  </fieldset>

  <input class="usa-button" type="submit" value="Create" disabled={submitting}>
</form>