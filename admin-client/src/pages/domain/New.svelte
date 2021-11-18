<script>
  import page from 'page';
  import { notification } from '../../stores';
  import { Await, GridContainer } from '../../components';
  import { createDomain, fetchRawSites } from '../../lib/api';

  import Form from './Form.svelte';

  $: sitesPromise = fetchRawSites();

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
      {sites}
    />
  </Await>
</GridContainer>