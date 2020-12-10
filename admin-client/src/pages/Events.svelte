<script>
  import { fetchEvents } from '../lib/api';
  import { router } from '../stores';
  import {
    GridContainer,
    PageTitle,
    PaginationBanner,
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
</script>

<style>

  td code {
    word-wrap: anywhere;
  }
</style>

<GridContainer classes={['padding-bottom-3']}>
  <PageTitle>Events</PageTitle>
  <div class="grid-row margin-bottom-3">
    {#if results}
      <form method="GET" action="/events" class="font-body-md">
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

  <hr class="margin-bottom-3"/>

  <div class="padding-x-1">
    {#await query}
      <p>Loading events...</p>
    {:then payload}
      {#if payload.data.length > 0}
        <PaginationBanner pagination={results} extraParams={params}/>
        <table class="usa-table usa-table--borderless width-full margin-top-05">
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
        <PaginationBanner pagination={results} extraParams={params}/>
      {:else}
        <p>No events found.</p>
      {/if}
    {/await}
    </div>
</GridContainer>
