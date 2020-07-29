<script>
  import api from '../lib/api';
  import GridContainer from '../components/GridContainer.svelte';
  import PageTitle from '../components/PageTitle.svelte';
  import SiteCard from '../components/SiteCard.svelte';

  const fetchBuilds = api.fetchBuilds();
</script>

<GridContainer>
  <PageTitle>Builds</PageTitle>
  {#await fetchBuilds}
    <p>Loading...</p>
  {:then builds}
    {#if builds.length > 0}
      {#each builds as build}
        <SiteCard />
      {/each}
    {/if}
  {/await}
</GridContainer>
