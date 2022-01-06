<script>
  import page from 'page';
  import { afterUpdate } from 'svelte';
  import { GridContainer } from '../../components';
  import { createOrganization } from '../../lib/api';

  let submitting = false;

  async function handleSubmit(event) {
    submitting = true;
    const {
      agency, name, managerUAAEmail, managerGithubUsername, sandbox, selfAuthorized,
    } = event.target.elements;

    const params = {
      agency: agency.value,
      name: name.value,
      managerUAAEmail: managerUAAEmail.value,
      managerGithubUsername: managerGithubUsername.value,
      isSandbox: sandbox.value === 'sandbox',
      isSelfAuthorized: selfAuthorized.checked,
    };

    const { invite } = await createOrganization(params);

    if (invite?.link) {
      // eslint-disable-next-line no-alert
      window.alert(`Invite sent to ${invite.email}: ${invite.link}`);
    }

    page('/organizations');
  }

  afterUpdate(() => { submitting = false; });
</script>

<GridContainer classes={['display-flex', 'flex-justify-center']}>
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
      <label class="usa-label" for="agency">Agency<abbr title="required" class="usa-hint usa-hint--required">*</abbr></label>
      <span class="usa-hint">Federal agency (GSA, OMB, etc...)</span>
      <input type="text" class="usa-input" name="agency" id="agency" required>
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

    <fieldset class="usa-fieldset">
      <legend class="usa-legend usa-legend">Organization Type</legend>
      <div class="usa-radio">
        <input
          class="usa-radio__input"
          id="regular"
          type="radio"
          name="sandbox"
          value="regular"
          checked
        />
        <label class="usa-radio__label" for="regular">Regular</label>
      </div>
      <div class="usa-radio">
        <input
          class="usa-radio__input"
          id="sandbox"
          type="radio"
          name="sandbox"
          value="sandbox"
        />
        <label class="usa-radio__label" for="sandbox">Sandbox</label>
      </div>
    </fieldset>

    <fieldset class="usa-fieldset">
      <legend class="usa-legend usa-legend">Authorization</legend>
      <div class="usa-checkbox">
        <input
          class="usa-checkbox__input usa-checkbox__input--tile"
          id="selfAuthorized-self"
          type="checkbox"
          name="selfAuthorized"
          value="self"
        />
        <label class="usa-checkbox__label" for="selfAuthorized-self">
          Self Authorized
        </label>
      </div>
    </fieldset>
    <input class="usa-button" type="submit" value="Create" disabled={submitting}>
  </form>
</GridContainer>