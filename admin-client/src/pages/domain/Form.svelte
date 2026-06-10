<script>
  import { siteName } from '../../lib/utils';
  import { Form, TextInput } from '../../components';

  export let sites;
  export let siteId;
  export let onFailure;
  export let onSubmit;
  export let onSuccess;

  const domain = {
    names: '',
    siteBranchConfigId: null,
    siteId: siteId || '',
  };

  $: siteOptions = sites
    .map((site) => ({
      label: siteName(site),
      value: site.id,
    }))
    .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

  $: contextOptions = !domain.siteId
    ? []
    : sites
      .find((site) => site.id === domain.siteId)
      .SiteBranchConfigs.filter((sbc) => sbc.context !== 'preview')
      .map((sbc) => ({
        label: `Branch: ${sbc.branch} | Context: ${sbc.context}`,
        value: sbc.id,
      }))
      .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

  $: {
    if (domain.siteId && domain.siteBranchConfigId) {
      const selected = sites.find((site) => site.id === domain.siteId);

      if (selected) {
        const configs = selected.SiteBranchConfigs;
        const configMatch = configs.find((sbc) => sbc.id === domain.siteBranchConfigId);

        if (!configMatch) {
          domain.siteBranchConfigId = null;
        }
      }
    }
  }
</script>

<Form
  action="Create"
  {onFailure}
  onSubmit={() => onSubmit(domain)}
  {onSuccess}
  title="Create Domain"
  large={true}
  let:errors
>
  <fieldset class="usa-fieldset">
    <label class="usa-label" for="site">
      Site<abbr title="required" class="usa-hint usa-hint--required">*</abbr>
    </label>
    <select
      class="usa-select"
      name="site"
      id="site"
      bind:value={domain.siteId}
    >
      <option value="">Select site</option>
      {#each siteOptions as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  </fieldset>

  <fieldset class="usa-fieldset">
    <label class="usa-label" for="context">
      Branch Context
      <abbr title="required" class="usa-hint usa-hint--required">*</abbr>
    </label>
    <select
      class="usa-select"
      name="context"
      id="context"
      bind:value={domain.siteBranchConfigId}
    >
      <option value="">Select site context and branch</option>
      {#each contextOptions as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  </fieldset>

  <TextInput
    hint="Comma separated list of valid domains"
    label="Domain Names"
    name="names"
    required
    error={errors.names}
    bind:value={domain.names}
  />
</Form>
