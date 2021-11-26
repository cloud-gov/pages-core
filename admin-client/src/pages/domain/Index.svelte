<script>
  import { fetchDomains } from '../../lib/api';
  import { PaginatedQueryPage } from '../../components';
  import Table from './Table.svelte';

  const fields = {
    site: {
      type: 'select',
      options: (meta) => meta.sites.map((site) => ({
        name: `${site.owner}/${site.repository}`,
        value: site.id,
      })),
    },
    state: {
      type: 'select',
      options: (meta) => meta.states,
    },
  };
</script>

<PaginatedQueryPage path="domains" query={fetchDomains} {fields} addAction let:data>
  <Table domains={data} />
</PaginatedQueryPage>