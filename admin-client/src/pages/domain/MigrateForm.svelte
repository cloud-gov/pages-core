<script>
  import { Modal } from '../../components';
  import { siteName } from '../../lib/utils';

  export let domain;
  export let candidates = [];
  export let closeModal;
  export let onMigrate;

  let targetSiteBranchConfigId = candidates.length === 1 ? candidates[0].id : '';
  let submitting = false;
  let error = null;

  $: options = candidates.map((candidate) => ({
    label: `${siteName(candidate.Site)} | ${candidate.context}: ${candidate.branch}`,
    value: candidate.id,
  }));

  $: target = candidates.find((candidate) => candidate.id === targetSiteBranchConfigId);

  // The origin stored on a domain has no protocol, the serialized site origin does.
  $: targetOrigin = target ? target.Site.siteOrigin.replace(/^https?:\/\//, '') : null;
  $: targetPath = target ? target.s3Key : null;

  async function handleSubmit() {
    if (!targetSiteBranchConfigId) return;

    submitting = true;
    error = null;

    try {
      await onMigrate(targetSiteBranchConfigId);
    } catch (e) {
      error = e.message;
      submitting = false;
    }
  }
</script>

<Modal>
  <div class="maxw-tablet-lg">
    <div class="display-flex flex-justify flex-align-center">
      <h3 class="margin-y-0">Migrate domain {domain.id}</h3>
      <button
        class="usa-button usa-button--base"
        on:click={(e) => { e.preventDefault(); closeModal(); }}
      >
        Close
      </button>
    </div>

    <p>
      This moves the custom domain
      <span class="font-code-sm bg-base-lightest padding-x-05">{domain.names}</span>
      from
      <span class="text-bold">{siteName(domain.Site)}</span>
      to another site without deprovisioning the existing external domain service,
      which keeps downtime to a minimum.
    </p>

    {#if error}
      <div class="usa-alert usa-alert--error usa-alert--slim">
        <div class="usa-alert__body">
          <p class="usa-alert__text">{error}</p>
        </div>
      </div>
    {/if}

    {#if candidates.length === 0}
      <div class="usa-alert usa-alert--info usa-alert--slim">
        <div class="usa-alert__body">
          <p class="usa-alert__text">
            There are no eligible sites with a site or demo branch configuration.
          </p>
        </div>
      </div>
    {:else}
      <form
        class="usa-form maxw-none width-full"
        on:submit={(e) => { e.preventDefault(); handleSubmit(); }}
      >
        <fieldset class="usa-fieldset">
          <label class="usa-label" for="target-domain">
            Migrate to
            <abbr title="required" class="usa-hint usa-hint--required">*</abbr>
          </label>
          <span class="usa-hint">
            Site and demo branch configurations on other sites
          </span>
          <select
            class="usa-select"
            id="target-domain"
            name="target-domain"
            bind:value={targetSiteBranchConfigId}
            required
          >
            <option value="">Select the new site and branch</option>
            {#each options as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </fieldset>

        <table class="usa-table usa-table--compact usa-table--borderless width-full">
          <thead>
            <tr>
              <th></th>
              <th>Current ({domain.id})</th>
              <th>After migration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-bold">site</td>
              <td>{siteName(domain.Site)}</td>
              <td>{target ? siteName(target.Site) : '-'}</td>
            </tr>
            <tr>
              <td class="text-bold">context</td>
              <td>{domain.SiteBranchConfig.context}</td>
              <td>{target ? target.context : '-'}</td>
            </tr>
            <tr>
              <td class="text-bold">branch</td>
              <td>{domain.SiteBranchConfig.branch}</td>
              <td>{target ? target.branch : '-'}</td>
            </tr>
            <tr>
              <td class="text-bold">origin</td>
              <td>{domain.origin || '-'}</td>
              <td>{targetOrigin || '-'}</td>
            </tr>
            <tr>
              <td class="text-bold">path</td>
              <td>{domain.path || '-'}</td>
              <td>{targetPath || '-'}</td>
            </tr>
            <tr>
              <td class="text-bold">service</td>
              <td>{domain.serviceName || '-'}</td>
              <td>{domain.serviceName || '-'}</td>
            </tr>
            <tr>
              <td class="text-bold">state</td>
              <td>pending, then deleted</td>
              <td>provisioned</td>
            </tr>
          </tbody>
        </table>

        <p>
          The external domain service
          <span class="font-code-sm bg-base-lightest padding-x-05">
            {domain.serviceName}
          </span>
          is kept and updated in place, and domain {domain.id} is deleted.
          After Cloud Foundry accepts the update, the destination site is rebuilt
          with the custom domain configuration.
        </p>

        <input
          class="usa-button usa-button--secondary"
          type="submit"
          value="Migrate domain"
          disabled={submitting || !targetSiteBranchConfigId}
        />
        <input
          class="usa-button usa-button--base"
          type="reset"
          value="Cancel"
          on:click={(e) => { e.preventDefault(); closeModal(); }}
        />
      </form>
    {/if}
  </div>
</Modal>
