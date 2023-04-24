<script>
  import { fetchUsers } from '../../lib/api';
  import { PaginatedQueryPage, UserTable } from '../../components';

  const fields = {
    organization: {
      type: 'select-auto',
      options: (meta) => meta.orgs.map((org) => ({
        name: org.name,
        value: org.id,
      })),
    },
    site: {
      type: 'select-auto',
      options: (meta) => meta.sites.map((site) => ({
        name: `${site.owner}/${site.repository}`,
        value: site.id,
      })),
    },
  };
</script>

<PaginatedQueryPage path="users" query={fetchUsers} {fields} addAction let:data>
  <UserTable users={data}/>
</PaginatedQueryPage>