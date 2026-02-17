<script>
  import page from 'page';
  import { afterUpdate } from 'svelte';
  import { notification, router } from '../stores';
  import {
    fetchBuild, fetchBuildLog, updateBuild, rebuildBuild,
  } from '../lib/api';
  import { formatDateTime } from '../helpers/formatter';
  import {
    Await,
    ExternalLink,
    GridContainer,
    PageTitle,
    LabeledItem,
  } from '../components';

  $: id = $router.params.id;
  $: buildPromise = fetchBuild(id);
  $: buildlogPromise = fetchBuildLog(id);

  const stateColor = (state) => ({
    success: 'bg-mint',
    error: 'bg-red',
    processing: 'bg-gold',
  }[state] || 'bg-gray-30');

  let submitting = false;

  async function handleFailSubmit() {
    submitting = true;
    const params = { state: 'error' };
    buildPromise = updateBuild(id, params);
  }

  afterUpdate(() => { submitting = false; });

  async function rebuild() {
    try {
      const siteId = await buildPromise.then((resp) => resp.site.id);
      await rebuildBuild({ buildId: id, siteId });
      page('/builds');
      return notification.setSuccess(`Build ${id} restarted successfully!`);
    } catch (error) {
      return notification.setError(`Unable to rebuild ${id}: ${error.message}`);
    }
  }
</script>

<GridContainer>
  <PageTitle>
    Build {id}
  </PageTitle>
  <Await on={buildPromise} let:response={build}>
    <h3>
      <div class="display-flex flex-justify flex-align-center font-sans-lg">
        <span><a href="/sites/{build.site.id}">{build.site.owner}/{build.site.repository}</a>#{build.branch}</span>
        <span class="usa-tag radius-pill padding-y-1 {stateColor(build.state)}">{build.state}</span>
      </div>
    </h3>
    <div class="grid-row">
      <div class="tablet:grid-col-fill padding-bottom-1">
        <LabeledItem label="id" value={build.id} />
        <LabeledItem label="branch" value={build.branch} />
        <LabeledItem label="requested commit" value={build.requestedCommitSha} />
        <LabeledItem label="cloned commit" value={build.clonedCommitSha} />
        <LabeledItem label="created at" value={formatDateTime(build.createdAt, true)} title={formatDateTime(build.createdAt)} />
        <LabeledItem label="updated at" value={formatDateTime(build.updatedAt, true)} title={formatDateTime(build.updatedAt)}/>
      </div>
      <div class="tablet:grid-col-auto padding-bottom-1">
        <div class="grid-row flex-column flex-align-end">
          {#if !['error', 'success', 'invalid'].includes(build.state)}
            <form on:submit|preventDefault={handleFailSubmit}>
              <input type="submit" value="Fail build" disabled={submitting}>
            </form>
          {/if}
          {#if !['invalid'].includes(build.state)}
            <LabeledItem label="started at" value={formatDateTime(build.startedAt, true)} title={formatDateTime(build.startedAt)} />
            <LabeledItem label="completed at" value={formatDateTime(build.completedAt, true)} title={formatDateTime(build.completedAt)} />
          {/if}
          <LabeledItem label="source" value={build.source} />
          <div>
            {#if !['invalid'].includes(build.state)}
                <ExternalLink href={build.url}>Live</ExternalLink>
            {/if}
            <ExternalLink
              icon="github"
              href="https://github.com/{build.site.owner}/{build.site.repository}">
              Repository
            </ExternalLink>
          </div>
          {#if !['invalid'].includes(build.state)}
            <button on:click={rebuild} class="usa-button margin-top-1">Rebuild</button>
          {/if}
          </div>
      </div>
    </div>
    {#if build.error}
      <b>Error: </b>{build.error}
    {/if}
    <pre class="grid-row font-mono-3xs padding-1">
      <Await on={buildlogPromise} let:response={log}>
        <span id="logs">{log}</span>
      </Await>
    </pre>
  </Await>
</GridContainer>

<style>
  pre {
    height: 600px;
    overflow: auto;
    box-shadow: inset 0 0 3px gray;
  }
</style>
