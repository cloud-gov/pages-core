<script>
  import { router } from '../stores';
  import { fetchEvents, fetchUser } from '../lib/api';
  import { formatDateTime } from '../helpers/formatter';
  import {
    Accordion,
    AccordionContent,
    Await,
    EventTable,
    GridContainer,
    LabeledItem,
    PageTitle,
  } from '../components';
  
  $: id = $router.params.id;
  $: userPromise = fetchUser(id);
  $: auditEventsPromise = fetchEvents({
    limit: 25, page: 1, type: 'audit', model: 'User', modelId: id,
  });
</script>

<GridContainer>
  <Await on={userPromise} let:response={user}>
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
        <LabeledItem label="uaa user id" value={user.uaa?.userId} />
        <LabeledItem label="uaa id" value={user.uaa?.uaaId} />
        <LabeledItem label="uaa origin" value={user.uaa?.origin} />        
        <LabeledItem label="uaa email" value={user.uaa?.email} />
        <LabeledItem label="uaa username" value={user.uaa?.username} />
      </div>
      <div class="tablet:grid-col-auto padding-bottom-1">
        <LabeledItem label="created at" value={formatDateTime(user.createdAt)} />
        <LabeledItem label="last signed in" value={formatDateTime(user.signedinAt)} />
        <LabeledItem label="last pushed" value={formatDateTime(user.pushedAt)} />
      </div>
    </div>
    <Accordion multiselect bordered>
      <AccordionContent title="Recent Audit Activity" expanded={true}>
        <Await on={auditEventsPromise} let:response={events}>
          <EventTable events={events.data} borderless={true} modelAudit={true}/>
        </Await>
      </AccordionContent>
    </Accordion>
  </Await>
</GridContainer>