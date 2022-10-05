<script>
  import { slide } from 'svelte/transition';
  import { formatDateTime } from '../helpers/formatter';

  import ExternalLink from './ExternalLink.svelte';

  export let index = 0;
  export let site = {
    awsBucketName: 'cg-123456789',
    awsBucketRegion: 'us-gov-west-1',
    buildStatus: 'active',
    createdAt: '2020-07-07T04:53:32.597Z',
    defaultBranch: 'master',
    demoViewLink:
      'https://cg-123456789.app.cloud.gov/demo/apburnes/example-node-site/',
    engine: 'node.js',
    id: 5,
    organizationId: 1,
    owner: 'apburnes',
    previewLink:
      'https://cg-123456789.app.cloud.gov/preview/apburnes/example-node-site/',
    repository: 'example-node-site',
    s3ServiceName: 'federalist-dev-s3',
    updatedAt: '2020-07-07T04:53:32.597Z',
    users: [],
    viewLink:
      'https://cg-123456789.app.cloud.gov/site/apburnes/example-node-site/',
  };

  const {
    awsBucketName,
    createdAt,
    demoViewLink,
    engine,
    id,
    owner,
    repository,
    s3ServiceName,
    updatedAt,
    viewLink,
    isActive,
    organizationId,
  } = site;

  const createDate = formatDateTime(createdAt);
  const updateDate = formatDateTime(updatedAt);

  $: bgColor = index % 2 === 0 ? 'bg-gray-5' : 'bg-white';
</script>

<style>
  p {
    margin-block-start: 0;
    margin-block-end: 0;
  }
</style>

<div class="padding-2 {bgColor}">
  <div
    transition:slide|local
    class="grid-container padding-top-1 shadow-2 bg-white">
    <div class="grid-row">
      <div class="tablet:grid-col-fill padding-bottom-1">
        <a href="/sites/{id}">
          <h3 class="text-bold margin-0">{owner}/{repository}</h3>
        </a>
      </div>
      <div class="tablet:grid-col-auto padding-bottom-1">
        <p class="font-mono-3xs text-ink">
          Status
          <span class="text-base">{isActive ? 'Active' : 'Inactive'}</span>
        </p>
        <p class="font-mono-3xs text-ink">
          Created
          <span class="text-base">{createDate}</span>
        </p>
        <p class="font-mono-3xs text-ink">
          Updated
          <span class="text-base">{updateDate}</span>
        </p>
      </div>
    </div>
    <div class="grid-row">
      <div class="tablet:grid-col-fill padding-bottom-1">
        <span class="usa-tag bg-mint">{engine}</span>
        <span class="usa-tag bg-orange">{awsBucketName}</span>
        <span class="usa-tag bg-accent-cool-dark">{s3ServiceName}</span>
        {#if organizationId}
          <span class="usa-tag bg-indigo">ORG: {organizationId}</span>
        {/if}
      </div>
      <div class="tablet:grid-col-auto padding-bottom-1">
        <ExternalLink href={viewLink}>Live</ExternalLink>
        <ExternalLink href={demoViewLink} className="padding-x-1">Demo</ExternalLink>
        <ExternalLink
          icon="github"
          href="https://github.com/{owner}/{repository}">
          Repository
        </ExternalLink>
      </div>
    </div>
  </div>
</div>
