<script>
  import { formatDateTime } from '../helpers/formatter';
  import DataTable from './DataTable.svelte';

  export let actions = [];
  export let borderless = false;

</script>

<DataTable data={actions} {borderless}>
  <tr slot="header">
    <th class="center">User</th>
    <th class="center">Action</th>
    <th class="center">Created</th>
    <th class="center">File</th>
    <th class="center">File Type</th>
  </tr>
  <tr slot="item" let:item={ua}>
    <td>{ua.email}</td>
    <td>{ua.description}</td>
    <td title={formatDateTime(ua.createdAt)}>{formatDateTime(ua.createdAt, true)}</td>
    <td>{ua.fileKey}</td>
    <td>{ua.fileType}</td>
  </tr>
</DataTable>

<style>
    .center {
        text-align: center;
    }
</style>