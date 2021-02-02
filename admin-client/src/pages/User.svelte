<script>
  import { onMount } from 'svelte';
  import { router } from '../stores';
  import { fetchEvents, fetchUser } from '../lib/api';
  import { formatDateTime } from '../helpers/formatter';

  import {
    Accordion,
    AccordionContent,
    GridContainer,
    JSONTreeView,
    LabeledItem,
    PageTitle,
  } from '../components';

  $: id = $router.params.id;

  let user = null;

  onMount(async () => { user = await fetchUser(id); });
</script>

<GridContainer>
  {#if user}
  <PageTitle>{user.username}</PageTitle>
    <div class="grid-row">
      <div class="tablet:grid-col-fill padding-bottom-1">
        <LabeledItem label="id" value={user.id} />
        <LabeledItem label="email" value={user.email} />
        <LabeledItem label="status">
          <span class="usa-tag {user.isActive ? 'bg-mint' : 'bg-gray-30'}">
            {user.isActive ? 'Active' : 'Inactive'}
          </span>
        </LabeledItem>
      </div>
      <div class="tablet:grid-col-auto padding-bottom-1">
        <LabeledItem label="created at" value={formatDateTime(user.createdAt)} />
        <LabeledItem label="last signed in" value={formatDateTime(user.signedinAt)} />
        <LabeledItem label="last pushed" value={formatDateTime(user.pushedAt)} />
      </div>
    </div>
    <Accordion multiselect bordered>
      <AccordionContent title="Recent Audit Activity" expanded={true}>
        {#if id}
          {#await fetchEvents({
            limit: 25, page: 1, type: 'audit', model: 'User', modelId: id,
          })}
            <p>Loading audit activity...</p>
          {:then payload}
            {#if payload.data.length > 0}
              <div class="usa-table-container--scrollable">
                <table class="usa-table usa-table--striped usa-table--borderless width-full font-sans-2xs">
                  <thead>
                    <tr>
                      <th>Label</th>
                      <th>Created</th>
                      <th>Message</th>
                      <th>Body</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each payload.data as event}
                      <tr>
                        <td>{event.label}</td>
                        <td>{formatDateTime(event.createdAt)}</td>
                        <td>{event.body.message || '--'}</td>
                        <td><JSONTreeView data={event.body}/></td>
                      </tr>
                    {/each}
                  </tbody>
                </table>  
              </div>
            {:else}
              <p>No events found.</p>
            {/if}
          {:catch error}
            <p>Something went wrong fetching the audit activity: {error.message}</p>
          {/await}
        {/if}
      </AccordionContent>
    </Accordion>
  {:else}
    <p>Loading user...</p>
  {/if}
  
</GridContainer>
