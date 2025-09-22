<script>
  import { fetchSiteFileStorageUserActions } from '../lib/api';
  import { PaginatedQueryPage } from '../components';
  import FileStorageActionsTable from '../components/FileStorageActionsTable.svelte';
  import { router } from '../stores';

  const siteFileStorageId = $router.params.id;
  const path = `site-file-storage/${siteFileStorageId}/user-actions`
  const title = 'File Storage Actions';
  const fields = {};
</script>

<PaginatedQueryPage title={title}
                    resourceId={siteFileStorageId}
                    {fields}
                    path={path}
                    query={fetchSiteFileStorageUserActions}
                    noSearch
                    let:data>
  <FileStorageActionsTable actions={data}/>
</PaginatedQueryPage>
