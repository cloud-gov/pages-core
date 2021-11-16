<script>
  import { notification, router } from '../stores';
  import {
    fetchBuilds,
    fetchSite,
    fetchUserEnvironmentVariables,
    fetchUsers,
    updateSite,
} from '../lib/api';
  import {
    Accordion,
    AccordionContent,
    Await,
    BuildTable,
    DataTable,
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
  $: uevsPromise = fetchUserEnvironmentVariables({ site: id });

  async function handleAdminConfigurationSubmit(site) {
    return updateSite(id, site);
  }

  async function handleAdminConfigurationSuccess(site) {
    sitePromise = Promise.resolve(site);
    notification.setSuccess('Site updated successfully');
  }

  function domains(site) {
    const ary = [];
    if (site.domain) {
      ary.push({ type: 'default', branch: site.defaultBranch, domain: site.domain });
    }
    if (site.demoDomain) {
      ary.push({ type: 'demo', branch: site.demoBranch, domain: site.demoDomain });
    }
    return ary;
  }

  function configs(site) {
    return ['default', 'demo', 'preview']
      .reduce((acc, name) => {
        const value = site[`${name}Config`];
        if (value) {
          acc.push({ name, value });
        }
        return acc;
      }, []);
  }
</script>

<GridContainer>
  <Await on={sitePromise} let:response={site}>
    <PageTitle>{site.owner}/{site.repository}</PageTitle>
    <SiteMetadata {site} />
    <Accordion multiselect bordered>
      <AccordionContent title="User Configuration">
        <h3>Domains</h3>
        <DataTable data={domains(site)} borderless={true}>
          <tr slot="header">
            <th>Type</th>
            <th>Branch</th>
            <th>Domain</th>
          </tr>
          <tr slot="item" let:item={domain}>
            <td>{domain.type}</td>
            <td>{domain.branch}</td>
            <td>{domain.domain}</td>
          </tr>
          <p slot="empty">No domains configured</p>
        </DataTable>

        <h3>Jekyll Configuration</h3>
        {#each configs(site) as config}
          <h5 class="text-uppercase">{config.name}</h5>
          <p><code class="bg-base-lightest padding-1 font-mono-xs">{config.value}</code></p>
        {:else}
        <p>No Jekyll configuration</p>
        {/each}

        <h3>Environment Variables</h3>
        <Await on={uevsPromise} let:response={uevs}>
          <DataTable data={uevs} borderless={true}>
            <tr slot="header">
              <th>Name</th>
              <th>Hint</th>
            </tr>
            <tr slot="item" let:item={uev}>
              <td>{uev.name}</td>
              <td>{uev.hint}</td>
            </tr>
            <p slot="empty">No environment variables configured</p>
          </DataTable>
        </Await>
      </AccordionContent>
      <AccordionContent title="Admin Configuration">
        <SiteForm
          {site}
          onSubmit={handleAdminConfigurationSubmit}
          onSuccess={handleAdminConfigurationSuccess} />
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