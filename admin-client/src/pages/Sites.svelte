<script>
  import { fetchSites } from '../lib/api';
  import { PaginatedQueryPage, SiteCard } from '../components';

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

<PaginatedQueryPage path="sites" query={fetchSites} {fields} let:data>
  {#each data as site, index}
    <SiteCard {site} {index} />
  {/each}
</PaginatedQueryPage>