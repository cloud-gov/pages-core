<script>
    import { formatDateTime } from '../helpers/formatter';
    import DataTable from './DataTable.svelte';

    export let tasks = [];
    export let borderless = false;

    const stateColor = (buildState) => ({
      success: 'bg-mint',
      error: 'bg-red',
      processing: 'bg-gold',
    }[buildState] || 'bg-gray-30');
</script>

  <DataTable data={tasks} {borderless}>
    <tr slot="header">
      <th class="center">Status</th>
      <th>Id</th>
      <th>Build</th>
      <th>Task Type</th>
      <th>Name</th>
      <th>Artifact</th>
      <th>Created</th>
      <th>Updated</th>
    </tr>
    <tr slot="item" let:item={task}>
      <td class="center">
        <span class="usa-tag radius-pill {stateColor(task.status)}">{task.status}</span>
      </td>
      <td>{task.id}</td>
      <td><a href="/builds/{task.buildId}">{task.buildId}</a></td>
      <td>{task.buildTaskTypeId}</td>
      <td>{task.name}</td>
      <td>{task.artifact}</td>
      <td title={formatDateTime(task.createdAt)}>{formatDateTime(task.createdAt, true)}</td>
      <td title={formatDateTime(task.updatedAt)}>{formatDateTime(task.udpatedAt, true)}</td>
    </tr>
    <p slot="empty">No build tasks found</p>
  </DataTable>
  
  <style>
    .center {
      text-align: center;
    }
  
    .wrap {
      white-space: normal;
    }
  </style>