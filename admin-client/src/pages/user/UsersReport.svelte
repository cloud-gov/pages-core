<script>
  import { formatDistanceStrict } from 'date-fns';
  import { downloadCSV } from '../../helpers/downloadCSV';
  import { fetchUsersReport, fetchUsersReportCSV } from '../../lib/api';
  import { PaginatedQueryPage, DataTable } from '../../components';
</script>

<PaginatedQueryPage path="reports/organizations" title="Users" query={fetchUsersReport} noSearch let:data>
  <div>
    <button type="button" class="usa-button margin-left-1" on:click={() => downloadCSV(fetchUsersReportCSV, 'users.csv')}>Download CSV of All Users</button>
  </div>
  <DataTable data={data}>
    <tr slot="header">
      <th scope="col">ID</th>
      <th scope="col">Github Email</th>
      <th scope="col">UAA Email</th>
      <th scope="col">Organizations</th>
      <th scope="col">Details</th>
      <th scope="col">Created</th>
      <th scope="col">Signed In</th>
    </tr>
    <tr slot="item" let:item={user}>
      <td>
        <a href="/organizations/{user.id}">{user.id}</a>
      </td>
      <td>
        {#if user.email }
          {user.email}
        {/if}
      </td>
      <td>
        {#if user.UAAIdentity }
          {user.UAAIdentity.email}
        {/if}
      </td>
      <td>
        {#if user.OrganizationRoles.length > 0}
          {
            user.OrganizationRoles.map((orgRole) => `${orgRole.Organization.name}`).join(', ')
          }
        {/if}
      </td>
      <td>
        {#if user.OrganizationRoles.length > 0}
          {
            user.OrganizationRoles.map((orgRole) => `${orgRole.Organization.name}: ${orgRole.Role.name}`).join(', ')
          }
        {/if}
      </td>
      <td>
        { formatDistanceStrict(new Date(user.createdAt), new Date(), { addSuffix: true, roundingMethod: 'floor' }) }
      </td>
      <td>
        {#if user.signedInAt }
          { formatDistanceStrict(new Date(user.signedInAt), new Date(), { addSuffix: true, roundingMethod: 'floor' }) }
        {:else }
          never
        {/if }
      </td>
    </tr>
  </DataTable>
</PaginatedQueryPage>