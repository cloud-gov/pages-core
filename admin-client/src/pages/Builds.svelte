<script>
  import { fetchBuilds } from '../lib/api';
  import { BuildTable, PaginatedQueryPage } from '../components';
  
  const fields = {
    site: {
      type: 'select-auto',
      options: (meta) => meta.sites.map((site) => ({
        name: `${site.owner}/${site.repository}`,
        value: site.id,
      })),
    },
    organization: {
      type: 'select',
      label: 'Organization',
      options: (meta) => {
        return (meta?.orgs || [])
          .map((org) => ({
            name: org.name,
            value: org.id,
          }))
          .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      },
    },
  };
</script>

<PaginatedQueryPage path="builds" query={fetchBuilds} {fields} let:data>
  <BuildTable builds={data} showSite={true} />
</PaginatedQueryPage>
