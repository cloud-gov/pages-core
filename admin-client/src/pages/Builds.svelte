<script>
  import { fetchBuilds } from '../lib/api';

  import BuildCard from '../components/BuildCard.svelte';
  import GridContainer from '../components/GridContainer.svelte';
  import PageTitle from '../components/PageTitle.svelte';
</script>

<GridContainer>
  <PageTitle>Builds</PageTitle>
  {#await fetchBuilds()}
    <p>Loading builds...</p>
  {:then builds}
    {#if builds.length > 0}
      {#each builds as build, index}
        <BuildCard {build} {index} showSite={true} />
      {/each}
    {:else}
      <p>No builds found.</p>
    {/if}
  {/await}
</GridContainer>
