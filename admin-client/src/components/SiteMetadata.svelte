<script>
  import { formatDateTime } from '../helpers/formatter';
  import { selectSiteLinks } from '../lib/utils';
  import ExternalLink from './ExternalLink.svelte';
  import LabeledItem from './LabeledItem.svelte';
  import SectionHeader from './SectionHeader.svelte';

  export let site = {};

  const {
    awsBucketName,
    createdAt,
    engine,
    id,
    owner,
    repository,
    s3ServiceName,
    updatedAt,
    isActive,
    organizationId,
  } = site;

  const siteLinks = selectSiteLinks(site);
  const createDate = formatDateTime(createdAt);
  const updateDate = formatDateTime(updatedAt);
</script>

<SectionHeader>
  Metadata
</SectionHeader>
<div class="grid-row">
  <div class="tablet:grid-col-fill padding-bottom-1">
    <LabeledItem label="id" value={id} />
    <LabeledItem label="owner" value={owner} />
    <LabeledItem label="repository" value={repository} />
    <LabeledItem label="status" value={isActive ? 'Active' : 'Inactive'} />
    <LabeledItem label="created at" value={createDate} />
    <LabeledItem label="updated at" value={updateDate} />
  </div>
  <div class="tablet:grid-col-auto padding-bottom-1">
    <div class="grid-row flex-column flex-align-end">
      <LabeledItem label="engine">
        <span class="usa-tag bg-mint">{engine}</span>
      </LabeledItem>
      <LabeledItem label="aws bucket name">
        <span class="usa-tag bg-orange">{awsBucketName}</span>
      </LabeledItem>
      <LabeledItem label="cf service name">
        <span class="usa-tag bg-accent-cool-dark">{s3ServiceName}</span>
      </LabeledItem>
      {#if organizationId}
        <LabeledItem label="organization id">
          <span class="usa-tag bg-indigo">{organizationId}</span>
        </LabeledItem>
      {/if}
      <div class="display-flex flex-row flex-justify-end margin-y-05">
        {#each siteLinks as siteLink, index}
          <ExternalLink
            href={siteLink.url}
            className={index > 0 ? 'padding-left-1' : ''}
          >
            {siteLink.context}
          </ExternalLink>
        {/each}
      </div>
      <div class="margin-y-05">
        <ExternalLink
          icon="github"
          href="https://github.com/{owner}/{repository}">
          Repository
        </ExternalLink>
      </div>
    </div>
  </div>
</div>

<style>
  span.usa-tag {
    text-transform: unset;
  }
</style>
