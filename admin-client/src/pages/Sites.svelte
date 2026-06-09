<script>
  import { fetchSites } from '../lib/api';
  import { PaginatedQueryPage, SiteCard } from '../components';

  const fields = {
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

<PaginatedQueryPage path="sites" query={fetchSites} {fields} let:data>
  {#each data as site, index}
    <SiteCard {site} {index} />
  {/each}
</PaginatedQueryPage>
