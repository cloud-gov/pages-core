<script>
  import { onMount } from 'svelte';
  import { notification, router } from '../stores';
  import {
    fetchBuilds,
    fetchSite,
    updateSite,
  } from '../lib/api';

  // import { destroySite } from '../flows';

  import {
    Accordion,
    AccordionContent,
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

  onMount(async () => { site = await fetchSite(id); });
</script>

<GridContainer>
  {#if site}
    <PageTitle>{site.owner}/{site.repository}</PageTitle>
    <SiteMetadata {site} />
    <Accordion multiselect bordered>
      <AccordionContent title="User Configuration">
        <p>TBD</p>
      </AccordionContent>
      <AccordionContent title="Admin Configuration">
        <SiteForm {site} on:submit={handleSubmit} />
      </AccordionContent>
      <AccordionContent title="Recent Builds">
        {#if id}
          {#await fetchBuilds({ site: id })}
            <p>Loading builds...</p>
          {:then builds}
            <BuildList builds={builds.data} />
          {:catch error}
            <p>Something went wrong fetching the site builds: {error.message}</p>
          {/await}
        {/if}
      </AccordionContent>
      <AccordionContent title="Collaborators">
        <p>TBD</p>
      </AccordionContent>
    </Accordion>
    
    <!-- <SiteDeleteForm {site} on:submit={destroySite(id)} /> -->
  {:else}
    <p>Loading site...</p>
  {/if}
  
</GridContainer>
