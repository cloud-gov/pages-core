<script>
  import { router } from '../stores';
  import { fetchBuild, fetchBuildLog } from '../lib/api';
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