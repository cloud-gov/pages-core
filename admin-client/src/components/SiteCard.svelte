<script>
  import { slide } from 'svelte/transition';
  import { formatDateTime } from '../helpers/formatter';

  import ExternalLink from './ExternalLink.svelte';

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
  } = site;

  const updateDate = formatDateTime(updatedAt);
  const createDate = formatDateTime(createdAt);
</script>

<style>
  .card-container {
    background-color: #f7f8f9;
  }

  p {
    margin-block-start: 0;
    margin-block-end: 0;
  }
</style>

<div
  transition:slide|local
  class="card-container grid-container mobile-lg:margin-bottom-3 margin-bottom-4
  padding-x-1 shadow-4">
  <div class="grid-row">
    <div class="grid-col-12 tablet:grid-col-fill text-primary padding-bottom-1">
      <a href="/sites/{id}">
        <h3 class="text-bold margin-bottom-05">{owner}/{repository}</h3>
      </a>
      <p class="font-mono-3xs text-base">
        Updated
        <span class="text-bold text-ink">{updateDate}</span>
      </p>
      <p class="font-mono-3xs text-base">
        Created
        <span class="text-bold text-ink">{createDate}</span>
      </p>
    </div>
    <div class="grid-col-12 tablet:grid-col-auto padding-bottom-1">
      <span class="usa-tag bg-mint">{engine}</span>
      <span class="usa-tag bg-orange">{awsBucketName}</span>
      <span class="usa-tag bg-accent-cool-dark">{s3ServiceName}</span>
    </div>
  </div>
  <div class="display-flex flex-column flex-align-end">
    <div class="inline">
      <ExternalLink href={viewLink}>Live</ExternalLink>
      <ExternalLink href={demoViewLink}>Demo</ExternalLink>
      <ExternalLink
        icon="github"
        href="https://github.com/{owner}/{repository}">
        Repository
      </ExternalLink>
    </div>
  </div>
</div>
