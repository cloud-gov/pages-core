<script>
  import { router } from '../../stores';
  import {
    fetchOrganization, fetchRoles, fetchSites, fetchUsers,
  } from '../../lib/api';
  import { formatDateTime } from '../../helpers/formatter';
  import {
    Accordion,
    AccordionContent,
    Await,
    GridContainer,
    LabeledItem,
    PageTitle,
    SiteCard,
    UserTableRoles
  } from '../../components';

  $: id = $router.params.id;
  $: orgPromise = fetchOrganization(id);
  $: sitesPromise = fetchSites({ organization: id });
  $: usersPromise = fetchUsers({ organization: id });
</script>

<GridContainer>
  <Await on={orgPromise} let:response={org}>
    <PageTitle>{org.name}</PageTitle>
    <div class="grid-row">
      <div class="tablet:grid-col-fill padding-bottom-1">
        <LabeledItem label="id" value={org.id} />
        <LabeledItem label="agency" value={org.agency} />
        <LabeledItem label="self authorized">
          <span class="usa-tag {org.isSelfAuthorized ? 'bg-mint' : 'bg-gray-30'}">
            {org.isSelfAuthorized ? 'Self-Authorized' : 'N/A'}
          </span>
        </LabeledItem>
        <LabeledItem label="sandbox">
          <span class="usa-tag {org.isSandbox ? 'bg-mint' : 'bg-gray-30'}">
            {org.isSandbox ? 'Sandbox' : 'Regular'}
          </span>
        </LabeledItem>
        <LabeledItem label="status">
          <span class="usa-tag {org.isActive ? 'bg-mint' : 'bg-gray-30'}">
            {org.isActive ? 'Active' : 'Inactive'}
          </span>
        </LabeledItem>

      </div>
      <div class="tablet:grid-col-auto padding-bottom-1">
        <LabeledItem label="created at" value={formatDateTime(org.createdAt)} />
        <LabeledItem label="updated at" value={formatDateTime(org.updatedAt)} />
      </div>
    </div>

    <!-- button <a href="/organizations/{org.id}/edit">{org.name}</a> -->

    <!-- <h3>UAA Info</h3>
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
    </div> -->

    <!-- <h3>Github Info</h3>
    <div class="grid-row">
      {#if user.hasGithubAuth}
        <div class="tablet:grid-col-fill padding-bottom-1">
          <LabeledItem label="github email" value={user.email} />
          <LabeledItem label="github username" value={user.username} />
        </div>
      {:else}
      <p>User is not connected to Github</p>
      {/if}
    </div> -->

    <Accordion multiselect bordered>
      <AccordionContent title="Sites" expanded={true}>
        <Await on={sitesPromise} let:response={orgSites}>
        {#each orgSites.data as site, index}
          <SiteCard {site} {index} />
        {/each}
        </Await>
      </AccordionContent>
    </Accordion>

    <Accordion multiselect bordered>
      <AccordionContent title="Users" expanded={true}>
        <Await on={usersPromise} let:response={users}>
          <UserTableRoles users={users.data} orgId={id} />
        </Await>
      </AccordionContent>
    </Accordion>
  </Await>
</GridContainer>
