<script>
  import { formatDateTime } from '../helpers/formatter';
  import DataTable from './DataTable.svelte';
  import JSONTreeView from './JSONTreeView.svelte';

  export let events;
  export let borderless = false;
  export let modelAudit = false;
</script>

<DataTable data={events} {borderless}>
  <tr slot="header">
    <th scope="col">
      {#if modelAudit}Label{:else}Name{/if}
    </th>
    <th scope="col">Created</th>
    {#if !modelAudit}
      <th scope="col">Model</th>
    {/if}
    <th scope="col">Message</th>
    <th scope="col">Body</th>
  </tr>
  <tr slot="item" let:item={event}>
    <th scope="row">
      {#if modelAudit}
        {event.label}
      {:else}
        <b>{event.type}</b> | {event.label}
      {/if}
    </th>
    <td>{formatDateTime(event.createdAt)}</td>
    {#if !modelAudit}
      <td>{#if event.model}{event.model}: {event.modelId}{/if}</td>
    {/if}
    <td>{event.body.message || '--'}</td>
    <td><JSONTreeView data={event.body}/></td>
  </tr>
</DataTable>