<script>
  import { siteName } from '../../lib/utils';
  import { Form, SelectInput, TextInput } from '../../components';

  export let sites;
  export let onFailure;
  export let onSubmit;
  export let onSuccess;

  const domain = {
    names: '',
    branch: '',
    siteId: '',
  };
</script>

<Form
  action="Create"
  {onFailure}
  onSubmit={() => onSubmit(domain)}
  {onSuccess}
  title="Create Domain"
  let:errors={errors}>

  <SelectInput
    label="Site"
    name="site"
    options={sites.map((site) => ({ label: siteName(site), value: site.id }))}
    required
    error={errors.siteId}
    bind:value={domain.siteId}
  />
  
  <TextInput
    hint="Comma separated list of valid domains"
    label="Domain Names"
    name="names" 
    required
    error={errors.names}
    bind:value={domain.names}
  />

  <TextInput
    label="Git Branch"
    name="branch" 
    required
    error={errors.branch}
    bind:value={domain.branch}
  />
</Form>