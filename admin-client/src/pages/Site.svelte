<script>
  import { notification, router } from '../stores';
  import {
    createSiteWebhook,
    fetchBuilds,
    fetchOrganizations,
    fetchSite,
    fetchSiteWebhooks,
    fetchTasks,
    fetchBuildTaskTypes,
    fetchUserEnvironmentVariables,
    updateSite,
    addSiteBuildTask,
    updateSiteBuildTask,
    removeBuildTask,
    fetchSiteFileStorage,
    createSiteFileStorage,
  } from '../lib/api';
  import {
    Accordion,
    AccordionContent,
    Await,
    BuildTable,
    DataTable,
    GridContainer,
    PageTitle,
    SiteDeleteForm,
    SiteForm,
    SiteFormOrganization,
    SiteFormWebhook,
    SiteMetadata,
    TaskTable,
  } from '../components';
  import { destroySite } from '../flows';
  import { selectSiteDomains, stateColor } from '../lib/utils';
  import SiteFormBuildTaskType from '../components/SiteFormBuildTaskType.svelte';
  import SiteFormUpdateBuildTaskType from '../components/SiteFormUpdateBuildTaskType.svelte';
  import SiteFormSiteFileStorage from '../components/SiteFormSiteFileStorage.svelte';

  const { id } = $router.params;
  $: sitePromise = fetchSite(id);
  $: siteWebhookPromise = fetchSiteWebhooks(id);
  $: buildsPromise = fetchBuilds({ site: id, limit: 10 });
  $: buildTasksPromise = fetchTasks({ site: id, limit: 10 });
  $: buildTaskTypesPromise = fetchBuildTaskTypes();
  $: orgsPromise = fetchOrganizations({ limit: 100 });
  $: uevsPromise = fetchUserEnvironmentVariables({ site: id });
  $: siteFileStoragePromise = fetchSiteFileStorage(id);

  const initEditedBuildTask = {
    isEditing: false,
    initialRunDay: null,
    data: null,
  };

  let editedBuildTask = initEditedBuildTask;

  async function handleOrganizationSubmit(organizationId) {
    return updateSite(id, { organizationId });
  }

  async function handleAdminConfigurationSubmit(site) {
    return updateSite(id, site);
  }

  async function handleOrgUpdateSuccess() {
    sitePromise = fetchSite(id);
    notification.setSuccess('Site added to organization successfully');
  }

  async function handleOrgUpdateFailure() {
    notification.setError('Site organization update error');
  }

  async function handleAdminConfigurationSuccess() {
    sitePromise = fetchSite(id);
    notification.setSuccess('Site updated successfully');
  }

  async function handleWebhookSubmit(siteId) {
    return createSiteWebhook(siteId);
  }

  async function handleWebhookSuccess() {
    notification.setSuccess('Site webhook created successfully');
  }

  async function handleWebhookFailure(error) {
    notification.setError(`Site webhook create error: ${error.message}`);
  }

  async function handleSiteFileStorageSubmit(siteId) {
    return createSiteFileStorage(siteId);
  }

  async function handleSiteFileStorageSuccess() {
    notification.setSuccess('Public File Storage created successfully');
    siteFileStoragePromise = await fetchSiteFileStorage(id);
  }

  async function handleSiteFileStorageFailure(error) {
    notification.setError(`Public File Storage create error: ${error.message}`);
  }

  async function handleSiteBuildTaskSubmit(
    buildTaskTypeId,
    branch,
    runDay = null,
  ) {
    return addSiteBuildTask(id, { buildTaskTypeId, branch, runDay });
  }

  async function handleSiteBuildTaskSuccess() {
    sitePromise = fetchSite(id);
    notification.setSuccess('Build task added successfully');
  }

  async function handleSiteBuildTaskFailure() {
    notification.setError('Build task update error');
  }

  async function handleCloseEditSiteBuildTask() {
    editedBuildTask = initEditedBuildTask;
  }

  async function handleOpenEditSiteBuildTask(data) {
    editedBuildTask = {
      isEditing: true,
      initialRunDay: data?.metadata?.runDay,
      data,
    };
  }

  async function handleEditSiteBuildTaskSubmit(sbtId, runDay = null) {
    return updateSiteBuildTask(sbtId, { runDay });
  }

  async function handleEditSiteBuildTaskSuccess() {
    sitePromise = fetchSite(id);
    notification.setSuccess('Build task edited successfully');
    editedBuildTask = initEditedBuildTask;
  }

  async function handleRemoveBuildTask(sbt) {
    await removeBuildTask(sbt.id);
    sitePromise = fetchSite(id);
  }

  function configs(site) {
    return ['default', 'demo', 'preview'].reduce((acc, name) => {
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
      <Await on={orgsPromise} let:response={orgs}>
        <AccordionContent title="Organization">
          <SiteFormOrganization
            {site}
            {orgs}
            onSubmit={handleOrganizationSubmit}
            onSuccess={handleOrgUpdateSuccess}
            onFailure={handleOrgUpdateFailure}
          />
        </AccordionContent>
      </Await>
      <AccordionContent title="User Configuration">
        <h3>Site Branch Configuration</h3>
        <DataTable data={site.SiteBranchConfigs} borderless={true}>
          <tr slot="header">
            <th>Context</th>
            <th>Branch</th>
            <th>Created At</th>
          </tr>
          <tr slot="item" let:item={sbc}>
            <td>{sbc.context}</td>
            <td>{sbc.branch}</td>
            <td>{sbc.createdAt}</td>
          </tr>
          <p slot="empty">No domains configured</p>
        </DataTable>
        <h3>Jekyll Configuration</h3>
        {#each configs(site) as config}
          <h5 class="text-uppercase">{config.name}</h5>
          <p>
            <code class="bg-base-lightest padding-1 font-mono-xs">
              {config.value}
            </code>
          </p>
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
      <AccordionContent title="Domains">
        <DataTable data={selectSiteDomains(site)} borderless={true}>
          <tr slot="header">
            <th>Domain Names</th>
            <th>Context</th>
            <th>Branch</th>
            <th>State</th>
            <th>Created At</th>
          </tr>
          <tr slot="item" let:item={domain}>
            <td><a href={`/domains/${domain.id}`}>{domain.names}</a></td>
            <td>{domain.context}</td>
            <td>{domain.branch}</td>
            <td>
              <span class="usa-tag radius-pill {stateColor(domain.state)}">
                {domain.state}
              </span>
            </td>
            <td>{domain.createdAt}</td>
          </tr>
          <p slot="empty">No domains configured</p>
        </DataTable>
        <div>
          <a class="usa-button" href={`/domains/new?siteId=${id}`}>
            Create Domain
          </a>
        </div>
      </AccordionContent>
      <Await on={siteFileStoragePromise} let:response={siteFileStorage}>
        <AccordionContent title="Public File Storage">
          <SiteFormSiteFileStorage
            {site}
            {siteFileStorage}
            onSubmit={handleSiteFileStorageSubmit}
            onSuccess={handleSiteFileStorageSuccess}
            onFailure={handleSiteFileStorageFailure}
          />
        </AccordionContent>
      </Await>
      <Await on={siteWebhookPromise} let:response={hooks}>
        <AccordionContent title="Webhooks">
          <SiteFormWebhook
            {site}
            {hooks}
            onSubmit={handleWebhookSubmit}
            onSuccess={handleWebhookSuccess}
            onFailure={handleWebhookFailure}
          />
        </AccordionContent>
      </Await>
      <AccordionContent title="Admin Configuration">
        <SiteForm
          {site}
          onSubmit={handleAdminConfigurationSubmit}
          onSuccess={handleAdminConfigurationSuccess}
        />
      </AccordionContent>
      <AccordionContent title="Recent Builds">
        <Await on={buildsPromise} let:response={builds}>
          <BuildTable builds={builds.data} borderless={true} />
        </Await>
      </AccordionContent>
      <AccordionContent title="Build Tasks">
        <Await on={buildTaskTypesPromise} let:response={buildTaskTypes}>
          <SiteFormBuildTaskType
            {buildTaskTypes}
            {site}
            onSubmit={handleSiteBuildTaskSubmit}
            onSuccess={handleSiteBuildTaskSuccess}
            onFailure={handleSiteBuildTaskFailure}
          />
        </Await>
        <h3>Registered Build Tasks</h3>
        <DataTable data={site.SiteBuildTasks} borderless={true}>
          <tr slot="header">
            <th>Id</th>
            <th>Build Task Type</th>
            <th>Type Id</th>
            <th>Branch</th>
            <th>Run Day</th>
            <th>Rules</th>
            <th>Created At</th>
            <th>Edit</th>
            <th>Remove</th>
          </tr>
          <tr slot="item" let:item={sbt}>
            <td>{sbt.id}</td>
            <td>{sbt.BuildTaskType.name}</td>
            <td>{sbt.buildTaskTypeId}</td>
            <td>{sbt.branch}</td>
            <td>
              {sbt.metadata?.runDay}
            </td>
            <td>{JSON.stringify(sbt.metadata?.rules)}</td>
            <td>{sbt.createdAt}</td>
            <td>
              <input
                class="usa-button"
                type="button"
                value="Edit"
                on:click|preventDefault={() => handleOpenEditSiteBuildTask(sbt)}
              />
            </td>
            <td>
              <input
                class="usa-button usa-button--base"
                type="reset"
                value="Remove"
                on:click|preventDefault={() => handleRemoveBuildTask(sbt)}
              />
            </td>
          </tr>
          <p slot="empty">No build tasks registered</p>
        </DataTable>
        <Await on={buildTasksPromise} let:response={buildTasks}>
          <TaskTable tasks={buildTasks.data} borderless={true} />
        </Await>
      </AccordionContent>
      <AccordionContent title="Delete Site">
        <SiteDeleteForm {site} on:submit={destroySite(site)} />
      </AccordionContent>
    </Accordion>
  </Await>
</GridContainer>

{#if editedBuildTask.isEditing}
  <SiteFormUpdateBuildTaskType
    isEditing={editedBuildTask.site}
    branch={editedBuildTask.data?.branch}
    buildTaskName={editedBuildTask?.data?.BuildTaskType?.name}
    id={editedBuildTask?.data?.id}
    initialRunDay={editedBuildTask.initialRunDay}
    runDay={editedBuildTask.data?.metadata?.runDay}
    closeModal={handleCloseEditSiteBuildTask}
    onSubmit={handleEditSiteBuildTaskSubmit}
    onSuccess={handleEditSiteBuildTaskSuccess}
    onFailure={handleSiteBuildTaskFailure}
  />
{/if}
