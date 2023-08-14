<script>
  import { formatDateTime } from '../../helpers/formatter';
  import DataTable from '../../components/DataTable.svelte';
  import {
    domainBranch, domainContext, stateColor, siteName,
  } from '../../lib/utils';

  export let domains = [];
  export let borderless = false;
</script>

<DataTable data={domains} {borderless}>
  <tr slot="header">
    <th>Id</th>
    <th>Names</th>
    <th>Site</th>
    <th>Context</th>
    <th>Branch</th>
    <th>Origin</th>
    <th>Path</th>
    <th>Service</th>
    <th class="center">Status</th>
    <th>Created</th>
    <th>Updated</th>
  </tr>
  <tr slot="item" let:item={domain}>
    <td><a href="/domains/{domain.id}">{domain.id}</a></td>
    <td>{domain.names}</td>
    <td><a href="/sites/{domain.Site.id}">{siteName(domain.Site)}</a></td>
    <td>{domainContext(domain)}</td>
    <td>{domainBranch(domain)}</td>
    <td>{domain.origin || '-' }</td>
    <td>{domain.path || '-' }</td>
    <td>{domain.serviceName || '-' }</td>
    <td class="center">
      <span class="usa-tag radius-pill {stateColor(domain.state)}">
        {domain.state}
      </span>
    </td>
    <td>{formatDateTime(domain.createdAt)}</td>
    <td>{formatDateTime(domain.updatedAt)}</td>
  </tr>
</DataTable>