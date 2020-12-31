<script>
  import BuildCard from './BuildCard.svelte';
  import SectionHeader from './SectionHeader.svelte';

  export let builds = [];
</script>

{#if builds.length === 0}
  <p>No builds are available.</p>
{/if}
{#each builds as build, index}
  <BuildCard {build} {index} />
{/each}
