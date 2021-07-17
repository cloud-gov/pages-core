<script>
  import page from 'page';
  import { afterUpdate } from 'svelte';
  import { Await, GridContainer } from '../../components';
  import { fetchOrganizations, fetchRoles, inviteUser } from '../../lib/api';

  let submitting = false;

  $: metaPromise = Promise.all([
    fetchOrganizations().then((payload) => payload.data),
    fetchRoles().then((payload) => payload.data),
  ]).then(([orgs, roles]) => ({ orgs, roles }));

  async function handleSubmit(event) {
    submitting = true;
    const {
      uaaEmail, githubUsername, organizationId, roleId,
    } = event.target.elements;

    const params = {
      uaaEmail: uaaEmail.value,
      githubUsername: githubUsername.value,
      organizationId: organizationId.value,
      roleId: roleId.value,
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
  <Await on={metaPromise} let:response={meta}>
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

      <fieldset class="usa-fieldset">
        <label class="usa-label" for="organizationId">Organization<abbr title="required" class="usa-hint usa-hint--required">*</abbr></label>
        <select class="usa-select" name="organizationId" id="organizationId" required>
          <option value="">--Select an organization--</option>
          {#each meta.orgs as org}
            <option value={org.id}>{org.name}</option>
          {/each}
        </select>
      </fieldset>

      <fieldset class="usa-fieldset">
        <legend class="usa-legend usa-legend">Select a role<abbr title="required" class="usa-hint usa-hint--required">*</abbr></legend>
        {#each meta.roles as role}
          <div class="usa-radio">
            <input class="usa-radio__input usa-radio__input--tile" id="role-{role.id}" type="radio" name="roleId" value={role.id}>
            <label class="usa-radio__label" for="role-{role.id}">{role.name}</label>
          </div>
        {/each}
      </fieldset>

      <input class="usa-button" type="submit" value="Create" disabled={submitting}>
    </form>
  </Await>
</GridContainer>
