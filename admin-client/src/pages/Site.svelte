<script>
  import { router } from '../stores';
  import { fetchBuilds, fetchSites } from '../lib/api';

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
    <p>Loading attributes...</p>
  {:then sites}
    {#if sites.length > 0}
      {#each sites as site}
          <PageTitle>{site.owner}/{site.repository}</PageTitle>
          <SiteMetadata {site} />
      {/each}
    {/if}
  {:catch error}
    <p>Something went wrong fetching the site metadata: {error.message}</p>
  {/await}
  {#await fetchBuilds({ site: id })}
    <p>Loading builds...</p>
  {:then builds}
    <BuildList {builds} />
  {:catch error}
    <p>Something went wrong fetching the site builds: {error.message}</p>
  {/await}
</GridContainer>
