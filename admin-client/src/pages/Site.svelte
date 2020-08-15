<script>
  import { router } from '../stores';
  import { fetchSites } from '../lib/api';

  import {
    BuildList,
    GridContainer,
    PageTitle,
    SiteMetadata,
  } from '../components';

  $: id = $router.params.id;
</script>

<GridContainer>
  {#await fetchSites({ q: id })}
    <p>Loading...</p>
  {:then sites}
    {#if sites.length > 0}
      {#each sites as site}
          <PageTitle>{site.owner}/{site.repository}</PageTitle>
          <SiteMetadata {site} />
      {/each}
    {/if}
  {:catch error}
    <p>Something went wrong fetching the site: {error.message}</p>
  {/await}
  <BuildList />
</GridContainer>
