<script>
  import { fetchBuilds } from '../lib/api';
  import { BuildTable, PaginatedQueryPage } from '../components';
  
  const fields = {
    site: {
      type: 'select',
      options: (meta) => meta.sites.map((site) => ({
        name: `${site.owner}/${site.repository}`,
        value: site.id,
      })),
    },
  };
</script>

<PaginatedQueryPage path="builds" query={fetchBuilds} {fields} let:data>
  <BuildTable builds={data} showSite={true} />
</PaginatedQueryPage>
