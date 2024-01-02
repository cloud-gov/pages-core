<script>
  import { formatDateTime } from '../helpers/formatter';
  import DataTable from './DataTable.svelte';

  export let users = [];
  export let borderless = false;
</script>

<DataTable data={users} {borderless}>
  <tr slot="header">
    <th>Id</th>
    <th>Username</th>
    <th>Github Email</th>
    <th>UAA Email</th>
    <th>Created</th>
    <th>Last Signed In</th>
    <th>Last Pushed</th>
  </tr>
  <tr slot="item" let:item={user}>
    <td><a href="/users/{user.id}">{user.id}</a></td>
    <td>{user.username || '-'}</td>
    <td>{user.email || '-'}</td>
    <td>{user.UAAIdentity?.email || '-'}</td>
    <td>{formatDateTime(user.createdAt)}</td>
    <td>{formatDateTime(user.signedInAt)}</td>
    <td>{formatDateTime(user.pushedAt)}</td>
  </tr>
</DataTable>