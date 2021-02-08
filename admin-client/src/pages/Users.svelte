<script>
  import { fetchUsers } from '../lib/api';
  import { router } from '../stores';
  import {
    Await,
    GridContainer,
    PageTitle,
    PaginationBanner,
    UserTable,
  } from '../components';
  
  const limits = [
    '10', '25', '50', '100',
  ];

  const defaultParams = {
    limit: '25',
    page: 1,
  };
  
  $: params = { ...defaultParams, ...($router.query || {}) };
  $: usersPromise = fetchUsers(params);
</script>

<GridContainer>
  <PageTitle>Users</PageTitle>
  <Await on={usersPromise} let:response={payload}>
    <div class="grid-row margin-bottom-3">
      <form method="GET" action="/builds" class="font-body-md">
        <input type="hidden" name="page" value="1"/>
        <label for="limit">Num Results</label>
        <select name="limit" id="limit" value={params.limit}>
          {#each limits as limit}
            <option value={limit}>{limit}</option>
          {/each}
        </select>        
        <button type="submit">Search</button>
      </form>
    </div>

    <hr class="margin-bottom-3"/>
    
    <div class="padding-x-1">
      <PaginationBanner pagination={payload} extraParams={params}/>
      <UserTable users={payload.data}/>
      <PaginationBanner pagination={payload} extraParams={params}/>
    </div>
  </Await>
</GridContainer>