<script>
  import Form from './Form.svelte';
  import DataTable from './DataTable.svelte';
  import { formatDateTime } from '../helpers/formatter';
  import { fetchSiteFileStorageUserActions } from '../lib/api';
  import Await from './Await.svelte';

  export let site;
  export let siteFileStorage;
  export let onSubmit;
  export let onSuccess;
  export let onFailure;

  const linkText = 'View';

</script>

<div class="grid-row">
  <div class="grid-col-12">
    <DataTable data={siteFileStorage.id ? [siteFileStorage] : []} borderless>
      <tr slot="header">
        <th>Id</th>
        <th class="center">State</th>
        <th>Created</th>
        <th>File Storage Actions</th>
      </tr>
      <tr slot="item" let:item={sfs}>
        <td>{sfs.id}</td>
        <td>
              <span class="usa-tag radius-pill bg-mint">
                Created
              </span>
        </td>
        <td>{formatDateTime(sfs.createdAt)}</td>
        <td>
          <Await on={fetchSiteFileStorageUserActions({}, sfs.id)} let:response={actions}>
            {#if actions?.data?.length > 0}
              <a href='/site-file-storage/{sfs.id}/user-actions?limit=50&page=1'>{linkText}</a>
            {:else}
              No actions yet
            {/if}
          </Await>
        </td>
      </tr>
      <p slot="empty">No Public File Storage created</p>
    </DataTable>
  </div>
  {#if !siteFileStorage.id}
    <div class="grid-col-12">
      <Form
        action="Add Public File Storage"
        onSubmit={() => onSubmit(site.id)}
        {onSuccess}
        {onFailure}
      >
      </Form>
    </div>
  {/if}
</div>



