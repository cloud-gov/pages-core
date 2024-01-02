<script>
  import { notification, router } from '../../stores';
  import {
    fetchEvents,
    fetchRoles,
    fetchUser,
    resendInvite,
    updateUserOrgRole,
    removeUserOrgRole,
  } from '../../lib/api';
  import { formatDateTime } from '../../helpers/formatter';
  import {
    Accordion,
    AccordionContent,
    Await,
    DataTable,
    EventTable,
    GridContainer,
    LabeledItem,
    PageTitle,
    Select,
  } from '../../components';

  $: id = $router.params.id;
  $: userPromise = fetchUser(id);
  $: auditEventsPromise = fetchEvents({
    limit: 25, page: 1, type: 'audit', model: 'User', modelId: id,
  });
  $: rolesPromise = fetchRoles();

  async function handleResendInvite(uaaEmail) {
    const { invite } = await resendInvite({ uaaEmail });

    if (invite) {
      // eslint-disable-next-line no-alert
      window.alert(`Resent invite for ${invite.email}: ${invite.link}`);
    }
  }

  function handleUpdateUserOrgRole(organizationId) {
    return async ({ roleId }) => {
      const response = await updateUserOrgRole({ userId: id, organizationId, roleId });

      if (response) {
        notification.setSuccess('Organization role updated.');
      }

      if (!response) {
        notification.setError('Error. Unable to update organization role.');
      }

      userPromise = fetchUser(id);
    };
  }

  function handleRemoveUserOrgRole(organizationId) {
    return async () => {
      const response = await removeUserOrgRole({ userId: id, organizationId });

      if (response) {
        notification.setSuccess('Removed user\'s organization role.');
      }

      if (!response) {
        notification.setError('Error. Unable to remove user\'s organization role.');
      }

      userPromise = fetchUser(id);
    };
  }
</script>

<GridContainer>
  <Await on={userPromise} let:response={user}>
    <PageTitle>{user.username}</PageTitle>
    <div class="grid-row">
      <div class="tablet:grid-col-fill padding-bottom-1">
        <LabeledItem label="id" value={user.id} />
        <LabeledItem label="username" value={user.username} />

      </div>
      <div class="tablet:grid-col-auto padding-bottom-1">
        <LabeledItem label="created at" value={formatDateTime(user.createdAt)} />
        <LabeledItem label="last signed in" value={formatDateTime(user.signedInAt)} />
        <LabeledItem label="last pushed" value={formatDateTime(user.pushedAt)} />
      </div>
    </div>

    <h3>UAA Info</h3>
    <div class="grid-row">
      {#if user.UAAIdentity}
        <div class="tablet:grid-col-fill padding-bottom-1">
          <LabeledItem label="uaa user id" value={user.UAAIdentity.userId} />
          <LabeledItem label="uaa id" value={user.UAAIdentity.uaaId} />
          <LabeledItem label="uaa origin" value={user.UAAIdentity.origin} />
          <LabeledItem label="uaa email" value={user.UAAIdentity.email} />
          <LabeledItem label="uaa username" value={user.UAAIdentity.username} />
        </div>
        <div class="tablet:grid-col-auto padding-bottom-1">
          <button
            class="usa-button"
            on:click|preventDefault={() => handleResendInvite(user.UAAIdentity.email)}>
            Resend Invite
          </button>
        </div>
      {:else}
        <p>User does not have a UAA Identity</p>
      {/if}
    </div>

    <h3>Github Info</h3>
    <div class="grid-row">
      {#if user.hasGithubAuth}
        <div class="tablet:grid-col-fill padding-bottom-1">
          <LabeledItem label="github email" value={user.email} />
          <LabeledItem label="github username" value={user.username} />
        </div>
      {:else}
      <p>User is not connected to Github</p>
      {/if}
    </div>

    <Accordion multiselect bordered>
      <Await on={rolesPromise} let:response={roles}>
        <AccordionContent title="Organizations" expanded={true}>
          {#if user.UAAIdentity}
              <div class="grid-row">
                <h3 class="padding-right-2">Add user to organization</h3>
                <a
                  class="usa-button usa-button--outline margin-y-2"
                  href={`/users/new?uaaEmail=${user.UAAIdentity.email}`}>
                  +
                </a>
              </div>
          {/if}
          <DataTable data={user.OrganizationRoles} borderless={true}>
            <tr slot="header">
              <th scope="col">Organization Name</th>
              <th scope="col">Role</th>
              <th scope="col">Action</th>
            </tr>
            <tr slot="item" let:item={orgRole}>
              <td>
                {orgRole.Organization.name}
              </td>
              <td>
                <Select
                  action="Update"
                  options={[{
                    name: 'roleId',
                    selected: orgRole.Role.id,
                    values: roles.data,
                  }]}
                  onAction={handleUpdateUserOrgRole(orgRole.Organization.id)}
                />
              </td>
              <td>
                <button
                  class="
                    usa-button
                    usa-button--secondary
                    padding-x-1
                    padding-y-05
                  "
                  on:click|preventDefault={handleRemoveUserOrgRole(orgRole.Organization.id)}
                >
                  Remove
                </button>
              </td>
            </tr>
          </DataTable>
        </AccordionContent>
      </Await>
    </Accordion>

    <Accordion multiselect bordered>
      <AccordionContent title="Recent Audit Activity" expanded={true}>
        <Await on={auditEventsPromise} let:response={events}>
          <EventTable events={events.data} borderless={true} modelAudit={true}/>
        </Await>
      </AccordionContent>
    </Accordion>
  </Await>
</GridContainer>
