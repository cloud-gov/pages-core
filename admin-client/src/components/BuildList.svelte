<script>
  import BuildCard from './BuildCard.svelte';
  import SectionHeader from './SectionHeader.svelte';

  export let builds = [];
</script>


<SectionHeader>
  Builds
</SectionHeader>
{#if builds.length === 0}
  <p>No builds are available.</p>
{/if}
{#each builds as build, index}
  <BuildCard {build} {index} />
{/each}
