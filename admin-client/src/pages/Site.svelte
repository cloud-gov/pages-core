<script>
  import { onMount } from 'svelte';
  import { notification, router } from '../stores';
  import { fetchBuilds, fetchSite, updateSite } from '../lib/api';

  import {
    BuildList,
    GridContainer,
    PageTitle,
    SiteForm,
    SiteMetadata,
  } from '../components';

  $: id = $router.params.id;

  let site = null;

  async function handleSubmit(params) {
    site = await updateSite(id, params);
    notification.setSuccess('Site updated successfully');
  }

  onMount(async () => { site = await fetchSite(id); });
</script>

<GridContainer>
  {#if site}
    <PageTitle>{site.owner}/{site.repository}</PageTitle>
    <SiteMetadata {site} />
    <SiteForm {site} on:submit={handleSubmit}/>
  {:else}    
    <p>Loading site...</p>
  {/if}
  {#await fetchBuilds({ site: id })}
    <p>Loading builds...</p>
  {:then builds}
    <BuildList {builds} />
  {:catch error}
    <p>Something went wrong fetching the site builds: {error.message}</p>
  {/await}
</GridContainer>
