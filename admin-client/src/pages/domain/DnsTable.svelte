<script>
  import DataTable from '../../components/DataTable.svelte';

  export let dnsRecords = [];
  export let dnsResults = [];
  export let borderless = false;

  export const stateColor = (state) => ({
    pending: 'bg-gray-30',
    error: 'bg-red',
    success: 'bg-mint',
  }[state] || 'bg-gray-30');

  $: domainDnsResults = dnsResults.reduce((acc, dnsResult) => ({
    ...acc,
    [dnsResult.record.name]: {
      state: dnsResult.state,
      message: dnsResult.message,
    },
  }), {});
</script>

<DataTable data={dnsRecords} {borderless}>
  <tr slot="header">
    <th>Type</th>
    <th>Name</th>
    <th>Target</th>
    <th class="center">Status</th>
    <th>Message</th>
  </tr>
  <tr slot="item" let:item={dns}>
    <td><code>{dns.type}</code></td>
    <td>{dns.name}</td>
    <td>{dns.target}</td>
    <td class="center">
      {#if domainDnsResults[dns.name]}
        <span class="usa-tag radius-pill {stateColor(domainDnsResults[dns.name].state)}">
          {domainDnsResults[dns.name].state}
        </span>
      {:else}
        ...
      {/if}
    </td>
    <td>
      {#if domainDnsResults[dns.name]}
        {domainDnsResults[dns.name].message ?? '-'}
      {:else}
      ...
      {/if}
    </td>
  </tr>
</DataTable>