<script>
  import { fetchUsers } from '../../lib/api';
  import { PaginatedQueryPage, UserTable } from '../../components';

  const fields = {};
</script>

<PaginatedQueryPage path="users" query={fetchUsers} {fields} addAction let:data>
  <UserTable users={data}/>
</PaginatedQueryPage>