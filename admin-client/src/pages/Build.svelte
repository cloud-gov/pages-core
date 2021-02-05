<script>
  import { onDestroy, onMount } from 'svelte';
  import { router } from '../stores';
  import { fetchBuild, fetchBuildLogEventSource } from '../lib/api';
  import { formatDateTime } from '../helpers/formatter';
  import {
    Await,
    GridContainer,
    PageTitle,
    LabeledItem, ExternalLink,
  } from '../components';

  export let tailLogs = true;

  let buildLogEventSource;

  $: id = $router.params.id;
  $: buildPromise = fetchBuild(id);

  function handleBuildLogMessage({ data }) {
    const logs = document.getElementById('logs');
    if (logs) {
      logs.innerHTML += JSON.parse(data);
    }
    if (tailLogs) {
      const anchor = document.getElementById('anchor');
      if (anchor) {
        anchor.scrollIntoView(false);
      }
    }
  }

  onMount(async () => {
    buildLogEventSource = fetchBuildLogEventSource(id, handleBuildLogMessage);
  });

  onDestroy(() => {
    if (buildLogEventSource && buildLogEventSource.readyState !== 2) {
      buildLogEventSource.close();
    }
  });

  function toggleTail() {
    tailLogs = !tailLogs;
  }

  const stateColor = (state) => ({
    success: 'bg-mint',
    error: 'bg-red',
    processing: 'bg-gold',
  }[state] || 'bg-gray-30');
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
        <LabeledItem label="created at" value={formatDateTime(build.createdAt)} />
        <LabeledItem label="updated at" value={formatDateTime(build.updatedAt)} />
      </div>
      <div class="tablet:grid-col-auto padding-bottom-1">
        <div class="grid-row flex-column flex-align-end">
          <LabeledItem label="started at" value={formatDateTime(build.startedAt)} />
          <LabeledItem label="completed at" value={formatDateTime(build.completedAt)} />
          <LabeledItem label="source" value={build.source} />
          <div>
            <ExternalLink href={build.viewLink}>Live</ExternalLink>
            <ExternalLink
              icon="github"
              href="https://github.com/{build.site.owner}/{build.site.repository}">
              Repository
            </ExternalLink>
          </div>
        </div>
      </div>
    </div>
    {#if build.error}
      <b>Error: </b>{build.error}
    {/if}
    <button on:click={toggleTail}>
      {tailLogs ? 'stop tail' : 'start tail'}
    </button>
    <pre class="grid-row font-mono-3xs padding-1">
      <span id="logs"></span>
      <span id="anchor"></span>
    </pre>
  </Await>
</GridContainer>

<style>
  pre {
    height: 600px;
    overflow: auto;
    box-shadow: inset 0 0 3px gray;
  }
  #anchor {
    height: 1px;
  }
</style>