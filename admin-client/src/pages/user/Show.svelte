<script>
  import { router } from '../../stores';
  import { fetchEvents, fetchUser, resendInvite } from '../../lib/api';
  import { formatDateTime } from '../../helpers/formatter';
  import {
    Accordion,
    AccordionContent,
    Await,
    EventTable,
    GridContainer,
    LabeledItem,
    PageTitle,
  } from '../../components';
  
  $: id = $router.params.id;
  $: userPromise = fetchUser(id);
  $: auditEventsPromise = fetchEvents({
    limit: 25, page: 1, type: 'audit', model: 'User', modelId: id,
  });

  async function handleResendInvite(uaaEmail) {
    const { invite } = await resendInvite({ uaaEmail });

    if (invite) {
      // eslint-disable-next-line no-alert
      window.alert(`Resent invite for ${invite.email}: ${invite.link}`);
    }
  }
</script>

<GridContainer>
  <Await on={userPromise} let:response={user}>
    <PageTitle>{user.username}</PageTitle>
    <div class="grid-row">
      <div class="tablet:grid-col-fill padding-bottom-1">
        <LabeledItem label="id" value={user.id} />
        <LabeledItem label="username" value={user.username} />
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

    <h3>UAA Info</h3>
    <div class="grid-row">
      {#if user.UAAIdentity}
        <div class="tablet:grid-col-fill padding-bottom-1">
          <LabeledItem label="uaa user id" value={user.UAAIdentity.userId} />
          <LabeledItem label="uaa id" value={user.UAAIdentity.UAAIdentityId} />
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

    <br/>

    <Accordion multiselect bordered>
      <AccordionContent title="Recent Audit Activity" expanded={true}>
        <Await on={auditEventsPromise} let:response={events}>
          <EventTable events={events.data} borderless={true} modelAudit={true}/>
        </Await>
      </AccordionContent>
    </Accordion>
  </Await>
</GridContainer>