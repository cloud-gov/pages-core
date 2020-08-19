<script>
  import { formatDateTime } from '../helpers/formatter';
  import ExternalLink from './ExternalLink.svelte';
  import LabeledItem from './LabeledItem.svelte';
  import SectionHeader from './SectionHeader.svelte';

  export let site = {};

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
        <span class="usa-tag bg-orange">{s3ServiceName}</span>
      </LabeledItem>
      <div>
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
