<script>
  import { fetchEvents } from '../lib/api';
  import { router } from '../stores';
  import {
    GridContainer,
    PageTitle,
  } from '../components';

  const defaultParams = {
    limit: 25,
    page: 1,
    type: '',
    label: '',
  };
  
  let results;
  $: params = { ...defaultParams, ...($router.query || {}) };
  $: query = fetchEvents(params);
  $: (async () => { results = await query; })();
  
  function toParams(updates = {}) {
    const p = { ...params, ...updates };
    const searchParams = new URLSearchParams();
    Object.keys(p).forEach((key) => {
      searchParams.set(key, p[key]);
    });
    return searchParams.toString();
  }
</script>

<style>
  a:not([href]) {
    opacity: .5;
  }
</style>

<GridContainer>
  <PageTitle>Events</PageTitle>
  <div class="grid-row flex-justify border-bottom padding-bottom-2">
    <div>
      {#if results}
        <form method="GET" action="/events">
          <input type="hidden" name="limit" value={params.limit}/>
          <input type="hidden" name="page" value="1"/>
          <label for="type">Event Type</label>
          <select name="type" id="type" value={params.type}>
            <option value="">-</option>
            {#each results.meta.eventTypes as type}
              <option value={type}>{type}</option>
            {/each}
          </select>
          <label for="label">Event Label</label>
          <select name="label" id="label" value={params.label}>
            <option value="">-</option>
            {#each results.meta.eventLabels as label}
              <option value={label}>{label}</option>
            {/each}
          </select>
          <button type="submit">Search</button>
        </form>
      {/if}
    </div>
    {#if results}
      <span>Viewing page <b>{results.currentPage}</b> of <b>{results.totalPages}</b> (total results: {results.totalItems})</span>
    {/if}
    <ul class="usa-button-group usa-button-group--segmented flex-justify-end">
      {#if results}
        <li>
          <a
            href={results.currentPage !== 1 ? `?${toParams({ page: 1 })}` : null}
            class="padding-x-1"
          >
            First
          </a>
        </li>
        <li>
          <a
            href={results.currentPage > 1 ? `?${toParams({ page: results.currentPage - 1 })}` : null}
            class="padding-x-1"
          >
            Previous
          </a>
        </li>
        <li>
          <a
            href={results.currentPage < results.totalPages ? `?${toParams({ page: results.currentPage + 1 })}` : null}
            class="padding-x-1"
          >
            Next
          </a>
        </li>
        <li>
          <a
            href={results.totalPages > 0 && results.currentPage !== results.totalPages ? `?${toParams({ page: results.totalPages })}` : null}
            class="padding-x-1"
          >
            Last
          </a>
        </li>        
      {/if}
    </ul>
  </div>

  <div class="padding-x-1">
    {#await query}
      <p>Loading events...</p>
    {:then payload}
      {#if payload.data.length > 0}

        <table class="usa-table usa-table--borderless width-full">
          <thead>
            <th scope="col">Name</th>
            <th scope="col">Model</th>
            <th scope="col">Body</th>
          </thead>
          <tbody>
            {#each payload.data as event, index}
              <tr>
                <th scope="row"><b>{event.type}</b> | {event.label}</th>
                <td>{#if event.model}{event.model}: {event.modelId}{/if}</td>
                <td><code>{JSON.stringify(event.body)}</code></td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p>No events found.</p>
      {/if}
    {/await}
    </div>
</GridContainer>
