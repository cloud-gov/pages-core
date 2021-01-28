<script>
  import { formatDateTime } from '../helpers/formatter';
  import { fetchUsers } from '../lib/api';
  import { router } from '../stores';
  import {
    GridContainer,
    PageTitle,
    PaginationBanner,
  } from '../components';
  
  const limits = [
    '10', '25', '50', '100',
  ];

  const defaultParams = {
    limit: '25',
    page: 1,
  };
  
  let results;
  $: params = { ...defaultParams, ...($router.query || {}) };
  $: query = fetchUsers(params);
  $: (async () => { results = await query; })();

  const stateColor = (isActive) => (isActive ? 'bg-mint' : 'bg-gray-30');
</script>

<GridContainer>
  <PageTitle>Users</PageTitle>
  <div class="grid-row margin-bottom-3">
    {#if results}
      <form method="GET" action="/builds" class="font-body-md">
        <input type="hidden" name="page" value="1"/>
        <label for="limit">Num Results</label>
        <select name="limit" id="limit" value={params.limit}>
          {#each limits as limit}
            <option value={limit}>{limit}</option>
          {/each}
        </select>        
        <button type="submit">Search</button>
      </form>
    {/if}
  </div>

  <hr class="margin-bottom-3"/>
  
  <div class="padding-x-1">
    {#await query}
      <p>Loading users...</p>
    {:then payload}
      <PaginationBanner pagination={results} extraParams={params}/>
      <div class="usa-table-container--scrollable">
        <table class="usa-table usa-table--striped usa-table--borderless width-full font-sans-2xs">
          <thead>
            <tr>
              <th>Id</th>
              <th>Github Username</th>
              <th>Email</th>
              <th>Created</th>
              <th>Last Signed In</th>
              <th>Last Pushed</th>
              <th class="center">Status</th>
            </tr>
          </thead>
          <tbody>
            {#each payload.data as user}
              <tr>
                <td><a href="users/{user.id}">{user.id}</a></td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{formatDateTime(user.createdAt)}</td>
                <td>{formatDateTime(user.signedInAt)}</td>
                <td>{formatDateTime(user.pushedAt)}</td>
                <td class="center">
                  <span class="usa-tag radius-pill {stateColor(user.isActive)}">
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>  
      </div>
      <PaginationBanner pagination={results} extraParams={params}/>
    {:catch error}
      <p>Something went wrong fetching the userss: {error.message}</p>
    {/await}
    </div>
</GridContainer>
