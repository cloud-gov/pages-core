<script>
  import { fetchEvents } from '../lib/api';
  import { router } from '../stores';
  import {
    Await,
    EventTable,
    GridContainer,
    PageTitle,
    PaginationBanner,
  } from '../components';

  const limits = [
    '10', '25', '50', '100',
  ];

  const defaultParams = {
    limit: '25',
    page: 1,
    type: '',
    label: '',
    model: '',
  };
  
  $: params = { ...defaultParams, ...($router.query || {}) };
  $: eventsPromise = fetchEvents(params);
</script>

<GridContainer classes={['padding-bottom-3']}>
  <PageTitle>Events</PageTitle>
  <Await on={eventsPromise} let:response={payload}>
    <div class="grid-row margin-bottom-3">
      <form method="GET" action="/events" class="font-body-md">
        <input type="hidden" name="page" value="1"/>
        <label for="type">Type</label>
        <select name="type" id="type" value={params.type}>
          <option value="">-</option>
          {#each payload.meta.eventTypes as type}
            <option value={type}>{type}</option>
          {/each}
        </select>
        <label for="label">Label</label>
        <select name="label" id="label" value={params.label}>
          <option value="">-</option>
          {#each payload.meta.eventLabels as label}
            <option value={label}>{label}</option>
          {/each}
        </select>
        <label for="model">Model</label>
        <select name="model" id="model" value={params.model}>
          <option value="">-</option>
          {#each payload.meta.models as model}
            <option value={model}>{model}</option>
          {/each}
        </select>
        <label for="limit">Num Results</label>
        <select name="limit" id="limit" value={params.limit}>
          {#each limits as limit}
            <option value={limit}>{limit}</option>
          {/each}
        </select>        
        <button type="submit">Search</button>
      </form>
    </div>

    <hr class="margin-bottom-3"/>

    <div class="padding-x-1">
      <PaginationBanner pagination={payload} extraParams={params}/>
      <EventTable events={payload.data}/>
      <PaginationBanner pagination={payload} extraParams={params}/>
    </div>
  </Await>
</GridContainer>