<script>
  import { fetchOrganizations } from '../lib/api';
  import { OrganizationTable, PaginatedQueryPage } from '../components';
</script>

<PaginatedQueryPage path="organizations" query={fetchOrganizations} addAction let:data>
  <OrganizationTable orgs={data}/>
</PaginatedQueryPage>
