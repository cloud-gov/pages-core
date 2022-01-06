<script>
  import { fetchOrganizations } from '../../lib/api';
  import { formatDateTime } from '../../helpers/formatter';
  import { DataTable, PaginatedQueryPage } from '../../components';
</script>

<PaginatedQueryPage path="organizations" query={fetchOrganizations} addAction let:data>
  <DataTable data={data}>
    <tr slot="header">
      <th scope="col">Name</th>
      <th scope="col">Agency</th>
      <th scope="col">Sandbox?</th>
      <th scope="col">Self Authorized</th>
      <th scope="col">Active?</th>
      <th scope="col">Created</th>
      <th scope="col">Updated</th>
      <th scope="col">View</th>
      <th scope="col">Actions</th>
    </tr>
    <tr slot="item" let:item={org}>
      <th scope="row">
        <a href="/organizations/{org.id}/edit">{org.name}</a>
      </th>
      <td>
        {org.agency}
      </td>
      <td>
        {#if org.isSandbox}
          <span class="usa-tag bg-orange">sandbox</span>
        {:else}
          regular
        {/if}
      </td>
      <td>{formatDateTime(org.selfAuthorizedAt)}</td>
      <td>
        {#if org.isActive}
          active
        {:else}
          <span class="usa-tag bg-gray">inactive</span>
        {/if}
      </td>
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
</PaginatedQueryPage>
