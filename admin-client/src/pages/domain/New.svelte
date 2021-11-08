<script>
  import page from 'page';
  import { notification } from '../../stores';
  import { Await, GridContainer } from '../../components';
  import { createDomain, fetchSites } from '../../lib/api';

  import Form from './Form.svelte';

  $: sitesPromise = fetchSites();

  function onSuccess() {
    page('/domains');
    notification.setSuccess('Domain created successfully!');
  }
</script>

<GridContainer classes={['display-flex', 'flex-justify-center']}>
  <Await on={sitesPromise} let:response={sites}>
    <Form
      onSubmit={createDomain}
      {onSuccess}
      sites={sites.data}
    />
  </Await>
</GridContainer>