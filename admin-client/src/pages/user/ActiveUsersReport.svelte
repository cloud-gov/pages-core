<script>
  import { formatDistanceStrict } from 'date-fns';
  import { downloadCSV } from '../../helpers/downloadCSV';
  import { fetchActiveUsersReport, fetchActiveUsersReportCSV } from '../../lib/api';
  import { PaginatedQueryPage, DataTable } from '../../components';
</script>

<PaginatedQueryPage path="reports/organizations" title="Active Users" query={fetchActiveUsersReport} noSearch let:data>
  <div>
    <button type="button" class="usa-button margin-left-1" on:click={() => downloadCSV(fetchActiveUsersReportCSV, 'active-users.csv')}>Download CSV of Active Users</button>
  </div>
  <DataTable data={data}>
    <tr slot="header">
      <th scope="col">ID</th>
      <th scope="col">Email</th>
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