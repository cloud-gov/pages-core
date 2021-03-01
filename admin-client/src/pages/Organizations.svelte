<script>
  import { fetchOrganizations } from '../lib/api';
  import { router } from '../stores';
  import {
    Await,
    OrganizationTable,
    GridContainer,
    PageTitle,
    PaginationBanner,
  } from '../components';

  const limits = [
    '10', '25', '50', '100',
  ];

  const defaultParams = {
    limit: '25',
    page: 1,
    name: '',
  };
  
  $: params = { ...defaultParams, ...($router.query || {}) };
  $: orgsPromise = fetchOrganizations(params);
</script>

<GridContainer classes={['padding-bottom-3']}>
  <PageTitle>Organizations</PageTitle>
  <Await on={orgsPromise} let:response={payload}>
    <div class="grid-row margin-bottom-3">
      <form method="GET" action="/organizations" class="font-body-md">
        <input type="hidden" name="page" value={params.page}/>
        <label for="name">Name</label>
        <input type="text" id="name" name="name" value={params.name}>
        <label for="limit">Num Results</label>
        <select name="limit" id="limit" value={params.limit}>
          {#each limits as limit}
            <option value={limit}>{limit}</option>
          {/each}
        </select>        
        <button class="usa-button usa-button--primary" type="submit">Search</button>
      </form>
    </div>

    <hr class="margin-bottom-3"/>

    <div class="padding-x-1">
      <PaginationBanner pagination={payload} extraParams={params}/>
      <OrganizationTable orgs={payload.data}/>
      <PaginationBanner pagination={payload} extraParams={params}/>
    </div>
  </Await>
</GridContainer>