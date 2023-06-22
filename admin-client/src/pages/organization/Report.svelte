<script>
  import { fetchOrganizationsReport, fetchOrganizationsReportCSV } from '../../lib/api';
  import { PaginatedQueryPage, DataTable } from '../../components';

  async function downloadCSV() {
    const csv = await fetchOrganizationsReportCSV();
    const blob = new Blob([csv], { type: 'application/octet-stream' });
    const aElement = document.createElement('a');
    aElement.setAttribute('download', 'organization-report.csv');
    const href = URL.createObjectURL(blob);
    aElement.href = href;
    aElement.setAttribute('target', '_blank');
    aElement.click();
    URL.revokeObjectURL(href);
  }

  const fields = {
    organization: {
      type: 'select-auto',
      options: (meta) => meta.orgs.map((org) => ({
        name: org.name,
        value: org.id,
      })),
    },
  };
</script>

<PaginatedQueryPage path="organizations-report" title="Organizations With Published Sites" query={fetchOrganizationsReport} {fields} noSearch let:data>
  <div>
    <button type="button" class="usa-button margin-left-1" on:click={downloadCSV}>Download CSV of All Published Sites</button>
  </div>
  <DataTable data={data}>
    <tr slot="header">
      <th scope="col">Organization</th>
      <th scope="col">Agency</th>
      <th scope="col">Site</th>
      <th scope="col">Domains</th>
      <th scope="col">Engine</th>
    </tr>
    <tr slot="item" let:item={domain}>
      <td>
        {#if domain.Site && domain.Site.Organization}
        <a href="/organizations/{domain.Site.Organization.id}">{domain.Site.Organization.name}</a>
        {/if}
      </td>
      <td>
        {#if domain.Site && domain.Site.Organization}
          {domain.Site.Organization.agency}
        {/if}
      </td>
      <td>
        {#if domain.Site }
          <a href="/sites/{domain.Site.id}">{domain.Site.repository}</a>
        {/if}
      </td>
      <td>
        <a href="/domains/{domain.id}">{domain.names}</a>
      </td>
      <td>
        {#if domain.Site }
          {domain.Site.engine}
        {/if}
      </td>
    </tr>
  </DataTable>
</PaginatedQueryPage>