<script>
  import { downloadCSV } from '../../helpers/downloadCSV';
  import { fetchPublishedSitesReport, fetchPublishedSitesReportCSV } from '../../lib/api';
  import { PaginatedQueryPage, DataTable } from '../../components';

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

<PaginatedQueryPage path="reports/published-sites" title="Organizations With Published Sites" query={fetchPublishedSitesReport} {fields} noSearch let:data>
  <div>
    <button type="button" class="usa-button margin-left-1" on:click={() => downloadCSV(fetchPublishedSitesReportCSV, 'published-sites.csv')}>Download CSV of All Published Sites</button>
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