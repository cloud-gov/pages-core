<script>
  import { formatDateTime } from '../helpers/formatter';
  import DataTable from './DataTable.svelte';

  export let orgs;
  export let borderless = false;
</script>

<DataTable data={orgs} {borderless}>
  <tr slot="header">
    <th scope="col">Name</th>
    <th scope="col">Created</th>
    <th scope="col">Updated</th>
    <th scope="col">View</th>
    <th scope="col">Actions</th>
  </tr>
  <tr slot="item" let:item={org}>
    <th scope="row">
      <a href="/organizations/{org.id}/edit">{org.name}</a>
    </th>
    <td>{formatDateTime(org.createdAt)}</td>
    <td>{formatDateTime(org.updatedAt)}</td>
    <td>
      <ul class="usa-button-group">
        <li class="usa-button-group__item">
          <a href="/users?organization={org.id}">Users</a>
        </li>
        <li class="usa-button-group__item">
          <a href="/sites?organization={org.id}">Sites</a>
        </li>
      </ul>
    </td>
    <td>
      <button class="usa-button usa-button--secondary">Delete</button>
    </td>
  </tr>
</DataTable>