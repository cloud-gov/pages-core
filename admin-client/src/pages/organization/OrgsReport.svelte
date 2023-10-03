<script>
  import { downloadCSV } from '../../helpers/downloadCSV';
  import { fetchOrganizationsReport, fetchOrganizationsReportCSV } from '../../lib/api';
  import { PaginatedQueryPage, DataTable } from '../../components';
</script>

<PaginatedQueryPage path="reports/organizations" title="Organizations" query={fetchOrganizationsReport} noSearch let:data>
  <div>
    <button type="button" class="usa-button margin-left-1" on:click={() => downloadCSV(fetchOrganizationsReportCSV, 'organizations.csv')}>Download CSV of All Organizations</button>
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