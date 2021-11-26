<script>
  import { siteName } from '../../lib/utils';
  import { Form, SelectInput, TextInput } from '../../components';

  export let sites;
  export let onFailure;
  export let onSubmit;
  export let onSuccess;

  const domain = {
    names: '',
    context: '',
    siteId: '',
  };

  $: siteOptions = sites.map((site) => ({ label: siteName(site), value: site.id }));

  let contextOptions = [];
  $: {
    const options = [];
    const selectedSite = sites.find((site) => site.id === domain.siteId);

    if (selectedSite) {
      options.push('site');
      if (selectedSite.demoBranch) {
        options.push('demo');
      }
    }
    contextOptions = options;
  }
</script>

<Form
  action="Create"
  {onFailure}
  onSubmit={() => onSubmit(domain)}
  {onSuccess}
  title="Create Domain"
  large={true}
  let:errors={errors}>

  <SelectInput
    label="Site"
    name="site"
    options={siteOptions}
    required
    error={errors.siteId}
    bind:value={domain.siteId}
  />

  <SelectInput
    hint="'site' or 'demo'"
    label="Context"
    name="context"
    options={contextOptions}
    required
    error={errors.context}
    bind:value={domain.context}
  />

  <TextInput
    hint="Comma separated list of valid domains"
    label="Domain Names"
    name="names" 
    required
    error={errors.names}
    bind:value={domain.names}
  />
</Form>