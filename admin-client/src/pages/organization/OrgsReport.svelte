<script>
  import { fetchOrganizationsReport, fetchOrganizationsReportCSV } from '../../lib/api';
  import { PaginatedQueryPage, DataTable } from '../../components';

  async function downloadCSV() {
    const csv = await fetchOrganizationsReportCSV();
    const blob = new Blob([csv], { type: 'application/octet-stream' });
    const aElement = document.createElement('a');
    aElement.setAttribute('download', 'organizations.csv');
    const href = URL.createObjectURL(blob);
    aElement.href = href;
    aElement.setAttribute('target', '_blank');
    aElement.click();
    URL.revokeObjectURL(href);
  }
</script>

<PaginatedQueryPage path="reports/organizations" title="Organizations" query={fetchOrganizationsReport} noSearch let:data>
  <div>
    <button type="button" class="usa-button margin-left-1" on:click={downloadCSV}>Download CSV of All Organizations</button>
  </div>
  <DataTable data={data}>
    <tr slot="header">
      <th scope="col">Organization</th>
      <th scope="col">Agency</th>
    </tr>
    <tr slot="item" let:item={org}>
      <td>
        <a href="/organizations/{org.id}">{org.name}</a>
      </td>
      <td>
        {org.agency}
      </td>
    </tr>
  </DataTable>
</PaginatedQueryPage>