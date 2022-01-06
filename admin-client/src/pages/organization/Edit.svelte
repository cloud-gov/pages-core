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
    const { agency, name, sandbox, selfAuthorized, active } = event.target.elements;

    const params = {
      agency: agency.value,
      name: name.value,
      isSandbox: sandbox.value === 'sandbox',
      isSelfAuthorized: selfAuthorized.checked,
      isActive: active.value === 'active'
    };

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

      <fieldset class="usa-fieldset">
        <label class="usa-label" for="agency">Agency<abbr title="required" class="usa-hint usa-hint--required">*</abbr></label>
        <span class="usa-hint">Federal agency (GSA, OMB, etc...)</span>
        <input type="text" class="usa-input" name="agency" id="agency" value={org.agency} required>
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
            checked={!org.isSandbox}
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
            checked={org.isSandbox}
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
            checked={org.isSelfAuthorized}
          />
          <label class="usa-checkbox__label" for="selfAuthorized-self">
            Self Authorized
          </label>
        </div>
      </fieldset>

      <fieldset class="usa-fieldset">
        <legend class="usa-legend usa-legend">Organization Status</legend>
        <div class="usa-radio">
          <input
            class="usa-radio__input"
            id="active"
            type="radio"
            name="active"
            value="active"
            checked={org.isActive}
          />
          <label class="usa-radio__label" for="active">Active</label>
        </div>
        <div class="usa-radio">
          <input
            class="usa-radio__input"
            id="inactive"
            type="radio"
            name="active"
            value="inactive"
            checked={!org.isActive}
          />
          <label class="usa-radio__label" for="inactive">Inactive</label>
        </div>
      </fieldset>
      <input class="usa-button" type="submit" value="Update" disabled={submitting}>
    </form>
  </Await>
</GridContainer>