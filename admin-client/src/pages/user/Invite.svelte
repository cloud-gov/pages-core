<script>
  import page from 'page';
  import { afterUpdate } from 'svelte';
  import { GridContainer } from '../../components';
  import { inviteUser } from '../../lib/api';

  let submitting = false;

  async function handleSubmit(event) {
    submitting = true;
    const { uaaEmail, githubUsername } = event.target.elements;

    const params = {
      uaaEmail: uaaEmail.value,
      githubUsername: githubUsername.value,
    };

    const { invite } = await inviteUser(params);

    if (invite) {
      // eslint-disable-next-line no-alert
      window.alert(`Created invite for ${invite.email}: ${invite.link}`);
    }

    page('/users');
  }

  afterUpdate(() => { submitting = false; });
</script>

<GridContainer classes={['display-flex', 'flex-justify-center']}>
  <form
    class="usa-form usa-form--large"
    on:submit|preventDefault={handleSubmit} >

    <legend class="usa-legend usa-legend--large">Invite User</legend>

    <p>
      Required fields are marked with an asterisk (<abbr title="required" class="usa-hint usa-hint--required">*</abbr>).
    </p>

    <fieldset class="usa-fieldset">
      <label class="usa-label" for="uaaEmail">UAA Email<abbr title="required" class="usa-hint usa-hint--required">*</abbr></label>
      <span class="usa-hint">The user will be created and invited to UAA if necessary.</span>
      <input type="email" class="usa-input" name="uaaEmail" id="uaaEmail" required>
    </fieldset>

    <fieldset class="usa-fieldset">
      <label class="usa-label" for="githubUsername">Github Username</label>
      <span class="usa-hint">Required to migrate an existing user.</span>
      <input type="text" class="usa-input" name="githubUsername" id="githubUsername">
    </fieldset>

    <input class="usa-button" type="submit" value="Create" disabled={submitting}>
  </form>
</GridContainer>