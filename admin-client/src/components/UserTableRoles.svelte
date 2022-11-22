<script>
  import { formatDateTime } from '../helpers/formatter';
  import DataTable from './DataTable.svelte';

  export let users = [];
  export let orgId = null;
  export let borderless = false;

  $: usersWithRoles = users.map((user) => {
    // ideally this filter would be done via sequelize but the scope wasn't playing nicely
    const role = user.OrganizationRoles
      .filter((orole) => orole.Organization.id === +orgId)[0].Role.name;
    return { ...user, role };
  });
</script>

<DataTable data={usersWithRoles} {borderless}>
  <tr slot="header">
    <th>Id</th>
    <th>Username</th>
    <th>Role</th>
    <th>Github Email</th>
    <th>UAA Email</th>
    <th>Last Signed In</th>
  </tr>
  <tr slot="item" let:item={user}>
    <td><a href="/users/{user.id}">{user.id}</a></td>
    <td>{user.username || '-'}</td>
    <td>{user.role}</td>
    <td>{user.email || '-'}</td>
    <td>{user.UAAIdentity?.email || '-'}</td>
    <td>{formatDateTime(user.signedInAt)}</td>
  </tr>
</DataTable>