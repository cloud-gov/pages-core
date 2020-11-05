<script>
  import { formatDateTime, formatSha } from '../helpers/formatter';

  import LabeledItem from './LabeledItem.svelte';

  export let index = 0;
  export let build = {};
  export let showSite = false;

  const {
    id,
    branch,
    commitSha,
    completedAt,
    state,
    site,
    createdAt,
  } = build;

  const completedDate = formatDateTime(completedAt);
  const createDate = formatDateTime(createdAt);

  $: bgColor = index % 2 === 0 ? 'bg-gray-5' : 'bg-white';

  const stateColor = (buildState) => ({
    success: 'bg-mint',
    error: 'bg-red',
    processing: 'bg-gold',
  }[buildState] || 'bg-gray-30');
</script>

<div class="padding-2 {bgColor}">
  <div class="grid-container padding-top-1 shadow-2 bg-white">
    {#if showSite}
      <div class="grid-row padding-bottom-1">
        <a href="/builds/{id}">
          <h3 class="text-bold margin-0">{site.owner}/{site.repository}</h3>
        </a>
      </div>
    {/if}
    <div class="grid-row grid-gap">
      <div class="grid-col-auto padding-bottom-1">
        <span class="usa-tag radius-pill {stateColor(state)}">{state}</span>
      </div>
      <div class="grid-col-auto padding-bottom-1">
        <LabeledItem label="id" value={id} />
      </div>
      <div class="grid-col-auto padding-bottom-1">
        <LabeledItem label="branch" value={branch} />
      </div>
      <div class="grid-col-auto padding-bottom-1">
        <LabeledItem label="commit" value={formatSha(commitSha)} />
      </div>
      <div class="grid-col-auto padding-bottom-1">
        <LabeledItem label="created" value={createDate} />
      </div>
      <div class="grid-col-auto padding-bottom-1">
        <LabeledItem label="completed" value={completedDate} />
      </div>
    </div>
  </div>
</div>
