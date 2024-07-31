<script>
    import prettyBytes from 'pretty-bytes';
    import { formatDateTime } from '../helpers/formatter';
    import DataTable from './DataTable.svelte';
    import JSONTreeView from './JSONTreeView.svelte';

    export let showSite = false;
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
      {#if showSite}<th>Site</th>{/if}
      <th>Task Type</th>
      <th>Created</th>
      <th>Updated</th>
      <th>Message</th>
    </tr>
    <tr slot="item" let:item={task}>
      <td class="center">
        <span class="usa-tag radius-pill {stateColor(task.status)}">{task.status}</span>
      </td>
      <td>{task.id}</td>
      <td><a href="/builds/{task.buildId}">{task.buildId}</a></td>
      {#if showSite}<td><a href="/sites/{task.Build.site}">{task.Build.Site.owner}/{task.Build.Site.repository}</a></td>{/if}
      <td>{task.BuildTaskType.name}</td>
      <td title={formatDateTime(task.createdAt)}>{formatDateTime(task.createdAt, true)}</td>
      <td title={formatDateTime(task.updatedAt)}>{formatDateTime(task.updatedAt, true)}</td>
      <td><JSONTreeView data={task.message}/></td>
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
