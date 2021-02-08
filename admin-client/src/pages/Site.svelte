<script>
  import { notification, router } from '../stores';
  import {
    fetchBuilds, fetchSite, fetchUsers, updateSite,
} from '../lib/api';
  import {
    Accordion,
    AccordionContent,
    Await,
    BuildTable,
    GridContainer,
    PageTitle,
    SiteForm,
    SiteMetadata,
    UserTable,
  } from '../components';

  $: id = $router.params.id;
  $: sitePromise = fetchSite(id);
  $: buildsPromise = fetchBuilds({ site: id, limit: 10 });
  $: usersPromise = fetchUsers({ site: id });

  async function handleSubmit({ detail }) {
    sitePromise = updateSite(id, detail);
    await sitePromise;
    notification.setSuccess('Site updated successfully');
  }
</script>

<GridContainer>
  <Await on={sitePromise} let:response={site}>
    <PageTitle>{site.owner}/{site.repository}</PageTitle>
    <SiteMetadata {site} />
    <Accordion multiselect bordered>
      <AccordionContent title="User Configuration">
        <p>TBD</p>
      </AccordionContent>
      <AccordionContent title="Admin Configuration">
        <SiteForm {site} on:submit={handleSubmit} />
      </AccordionContent>
      <AccordionContent title="Recent Builds">
        <Await on={buildsPromise} let:response={builds}>
          <BuildTable builds={builds.data} borderless={true}/>
        </Await>
      </AccordionContent>
      <AccordionContent title="Collaborators">
        <Await on={usersPromise} let:response={users}>
          <UserTable users={users.data} borderless={true}/>
        </Await>
      </AccordionContent>
    </Accordion>
  </Await>
</GridContainer>
