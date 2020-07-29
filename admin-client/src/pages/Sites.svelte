<script>
  import api from '../lib/api';
  import GridContainer from '../components/GridContainer.svelte';
  import PageTitle from '../components/PageTitle.svelte';
  import SiteCard from '../components/SiteCard.svelte';
  
  const fetchSites = api.fetchSites();
</script>

<GridContainer>
  <PageTitle>Sites</PageTitle>
    {#await fetchSites}
      <p>Loading...</p>
    {:then sites}
      {#if sites.length > 0}
        {#each sites as site}
          <SiteCard {site} />
        {/each}
      {/if}
    {/await}
</GridContainer>
