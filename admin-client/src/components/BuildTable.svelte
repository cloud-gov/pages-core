<script>
  import { formatDateTime, formatSha } from '../helpers/formatter';
  import DataTable from './DataTable.svelte';

  export let builds = [];
  export let showSite = false;
  export let borderless = false;

  const stateColor = (buildState) => ({
    success: 'bg-mint',
    error: 'bg-red',
    processing: 'bg-gold',
  }[buildState] || 'bg-gray-30');
</script>

<DataTable data={builds} {borderless}>
  <tr slot="header">
    {#if showSite}<th>Site</th>{/if}
    <th class="center">State</th>
    <th>Id</th>
    <th>Branch</th>
    <th class="wrap">Requested Commit</th>
    <th class="wrap">Cloned Commit</th>
    <th>Created</th>
    <th>Started</th>
    <th>Completed</th>
  </tr>
  <tr slot="item" let:item={build}>
    {#if showSite}
      <td>
        <a href="/sites/{build.site.id}">
          {build.site.owner}/{build.site.repository}
        </a>
      </td>
    {/if}
    <td class="center">
      <span class="usa-tag radius-pill {stateColor(build.state)}">{build.state}</span>
    </td>
    <td><a href="/builds/{build.id}">{build.id}</a></td>
    <td>{build.branch}</td>
    <td>{formatSha(build.requestedCommitSha)}</td>
    <td>{formatSha(build.clonedCommitSha)}</td>
    <td>{formatDateTime(build.createdAt)}</td>
    <td>{formatDateTime(build.startedAt)}</td>
    <td>{formatDateTime(build.completedAt)}</td>    
  </tr>
</DataTable>

<style>
  .center {
    text-align: center;
  }

  .wrap {
    white-space: normal;
  }
</style>