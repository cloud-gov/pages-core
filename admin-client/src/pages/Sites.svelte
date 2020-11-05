<script>
  import page from 'page';
  import { fetchSites } from '../lib/api';
  import {
    GridContainer,
    PageTitle,
    SiteCard,
  } from '../components';
  import { router } from '../stores';

  $: search = $router.query.q || '';
  $: query = fetchSites({ q: search });

  function handleSubmit(event) {
    page(`/sites?q=${event.target.elements.search.value}`);
  }
</script>

<style>
  .usa-form__note {
    float: none;
    font-weight: normal;
    margin-bottom: 0;
  }
</style>

<GridContainer>
  <PageTitle>Sites</PageTitle>
  <div class="grid-row flex-justify-end padding-bottom-2 border-bottom margin-bottom-2">
    <div>
      <form
        class="usa-search usa-search--small"
        role="search"
        on:submit|preventDefault={handleSubmit}
      >
        <label class="usa-sr-only" for="search">Search by id or owner/repository text:</label>
        <input
          class="usa-input"
          id="search"
          name="search"
          type="search"
          autocapitalize="off"
          autocorrect="off"
          value={search}
        >
        <button class="usa-button" type="submit">
          <span class="usa-sr-only">Search</span>
        </button>
      </form>
      <p class="usa-form__note">
        Search by id or owner/repository text
      </p>
    </div>
  </div>
  {#await query}
    <p>Loading...</p>
  {:then sites}
    {#if sites.length > 0}
      {#each sites as site, index}
        <SiteCard {site} {index} />
      {/each}
    {/if}
  {/await}
</GridContainer>
