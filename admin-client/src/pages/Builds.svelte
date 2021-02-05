<script>
  import { fetchBuilds } from '../lib/api';
  import { router } from '../stores';
  import {
    Await,
    BuildTable,
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
  };
  
  $: params = { ...defaultParams, ...($router.query || {}) };
  $: buildsPromise = fetchBuilds(params);
</script>

<GridContainer>
  <PageTitle>Builds</PageTitle>
  <Await on={buildsPromise} let:response={payload}>
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
      <BuildTable builds={payload.data} showSite={true} />
      <PaginationBanner pagination={payload} extraParams={params}/>
    </div>
  </Await>
</GridContainer>
