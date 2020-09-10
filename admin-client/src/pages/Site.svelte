<script>
  import { onMount } from 'svelte';
  import { notification, router } from '../stores';
  import {
    destroySite,
    fetchBuilds,
    fetchSite,
    updateSite,
  } from '../lib/api';

  import {
    BuildList,
    SiteDeleteForm,
    GridContainer,
    PageTitle,
    SiteForm,
    SiteMetadata,
  } from '../components';

  $: id = $router.params.id;

  let site = null;

  async function handleSubmit({ detail }) {
    site = await updateSite(id, detail);
    notification.setSuccess('Site updated successfully');
  }

  async function handleDestroy() {
    await destroySite(id);
    notification.setSuccess('Site deleted successfully');
  }

  onMount(async () => { site = await fetchSite(id); });
</script>

<GridContainer>
  {#if site}
    <PageTitle>{site.owner}/{site.repository}</PageTitle>
    <SiteMetadata {site} />
    <SiteForm {site} on:submit={handleSubmit} />
    <SiteDeleteForm {site} on:submit={handleDestroy} />
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
