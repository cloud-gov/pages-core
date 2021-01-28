<script>
  import { fetchBuilds } from '../lib/api';
  import { router } from '../stores';
  import {
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
  
  let results;
  $: params = { ...defaultParams, ...($router.query || {}) };
  $: query = fetchBuilds(params);
  $: (async () => { results = await query; })();
</script>

<GridContainer>
  <PageTitle>Builds</PageTitle>
  <div class="grid-row margin-bottom-3">
    {#if results}
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
    {/if}
  </div>

  <hr class="margin-bottom-3"/>
  
  <div class="padding-x-1">
    {#await query}
      <p>Loading builds...</p>
    {:then payload}
      <PaginationBanner pagination={results} extraParams={params}/>
      <BuildTable builds={payload.data} showSite={true} />
      <PaginationBanner pagination={results} extraParams={params}/>
    {:catch error}
      <p>Something went wrong fetching the builds: {error.message}</p>
    {/await}
    </div>
</GridContainer>
