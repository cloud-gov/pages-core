<script>
  import Form from './Form.svelte';
  import DataTable from './DataTable.svelte';

  export let site;
  export let hooks = [];
  export let onSubmit;
  export let onSuccess;
  export let onFailure;

  const hookData = hooks.map((hook) => ({
    id: hook?.id,
    url: hook?.config?.url,
    status: hook?.last_response?.status,
    message: hook?.last_response?.message,
  }));
</script>

<div class="grid-row">
  <div class="grid-col-12">
    <DataTable data={hookData} borderless>
      <tr slot="header">
        <th>ID</th>
        <th>URL</th>
        <th>Status</th>
        <th>Message</th>
      </tr>
      <tr slot="item" let:item={hook}>
        <td>{hook.id}</td>
        <td>{hook.url}</td>
        <td>{hook.status}</td>
        <td>{hook.message}</td>
      </tr>
    </DataTable>
  </div>
  <div class="grid-col-12">
    <Form
      action="Add Pages Webhook"
      onSubmit={() => onSubmit(site.id)}
      {onSuccess}
      {onFailure}
    >
    </Form>
  </div>
</div>
